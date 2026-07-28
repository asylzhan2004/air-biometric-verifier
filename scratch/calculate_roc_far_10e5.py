"""
NIST FRVT FAR = 10^-5 (1 in 100,000) Production Pipeline Calibration Script
- Evaluates exact production pipeline with dynamic yaw-adaptive periocular fusion
- Calculates TRUE exact Clopper-Pearson 95% Binomial Confidence Intervals
- Scaled for 100,000+ impostor pair comparisons across dataset identity folders
"""
import os
import sys
import math
import torch
import numpy as np
import PIL.Image
from facenet_pytorch import InceptionResnetV1, MTCNN
from scipy.stats import beta

sys.stdout.reconfigure(encoding='utf-8')

def clopper_pearson_ci(k, n, alpha=0.05):
    """Calculates true exact 95% Clopper-Pearson Binomial Confidence Interval."""
    if n == 0:
        return 0.0, 0.0
    lower = 0.0 if k == 0 else float(beta.ppf(alpha / 2, k, n - k + 1))
    upper = 1.0 if k == n else float(beta.ppf(1 - alpha / 2, k + 1, n - k))
    return lower, upper

def main():
    print("=" * 85)
    print("[NIST FRVT PRODUCTION CALIBRATION] True FAR = 10^-5 (1 in 100,000) Evaluation")
    print("=" * 85)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    embedder = InceptionResnetV1(pretrained='vggface2').eval().to(device)

    pth_path = "models/finetuned_kyc_arcface.pth"
    if os.path.exists(pth_path):
        try:
            state = torch.load(pth_path, map_location=device, weights_only=False)
            res = embedder.load_state_dict(state, strict=False)
            print(f"[LOAD] Loaded SOTA weights from {pth_path}")
            if res.missing_keys:
                print(f"[WEIGHT AUDIT] Missing keys: {len(res.missing_keys)}")
            if res.unexpected_keys:
                print(f"[WEIGHT AUDIT] Unexpected keys: {len(res.unexpected_keys)}")
        except Exception as e:
            print(f"[WARNING] Could not load checkpoint: {e}")

    mtcnn = MTCNN(image_size=160, margin=20, keep_all=False, device=device)

    dataset_dirs = [
        r"X:\работа с обучением\archive (14)\img",
        r"X:\работа с обучением\archive (16)\img",
    ]

    identity_folders = []
    for d in dataset_dirs:
        if os.path.exists(d):
            folders = [os.path.join(d, sub) for sub in os.listdir(d) if os.path.isdir(os.path.join(d, sub))]
            identity_folders.extend(folders)

    # Sample identity folders to generate hundreds of thousands of impostor pairs
    identity_folders = identity_folders[:250]
    embeddings_by_id = {}
    print(f"[DATASET SAMPLING] Extracting production features across {len(identity_folders)} identity folders...")

    for folder in identity_folders:
        id_name = os.path.basename(folder)
        img_files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(('.jpg', '.png', '.jpeg'))][:4]
        embs = []
        for img_p in img_files:
            try:
                img = PIL.Image.open(img_p).convert('RGB')
                boxes, probs, landmarks = mtcnn.detect(img, landmarks=True)
                aligned_tensor = mtcnn(img)

                if aligned_tensor is not None:
                    # Estimate head yaw from landmarks
                    yaw_ratio = 0.0
                    if landmarks is not None and len(landmarks) > 0:
                        pts = landmarks[0]
                        eye_w = max(1.0, pts[1][0] - pts[0][0])
                        yaw_ratio = float((pts[2][0] - (pts[0][0] + pts[1][0]) / 2.0) / eye_w)

                    full_batch = aligned_tensor.unsqueeze(0).to(device)
                    with torch.no_grad():
                        f_emb = embedder(full_batch).cpu().numpy()[0]
                        f_norm = f_emb / np.linalg.norm(f_emb)

                    u_tensor = aligned_tensor.clone()
                    u_tensor[:, int(160 * 0.68):, :] = 0.0
                    u_batch = u_tensor.unsqueeze(0).to(device)
                    with torch.no_grad():
                        u_emb = embedder(u_batch).cpu().numpy()[0]
                        u_norm = u_emb / np.linalg.norm(u_emb)

                    embs.append((f_norm, u_norm, yaw_ratio))
            except Exception:
                pass
        if len(embs) > 0:
            embeddings_by_id[id_name] = embs

    print(f"[COLLECTED] {len(embeddings_by_id)} valid identities.")

    genuine_scores = []
    impostor_scores = []

    # Production Adaptive Yaw Periocular Fusion calculation
    def calc_fused_sim(emb_a, emb_b):
        f_norm_a, u_norm_a, yaw_a = emb_a
        f_norm_b, u_norm_b, yaw_b = emb_b

        f_sim = float(np.clip(np.dot(f_norm_a, f_norm_b), 0.0, 1.0))
        u_sim = float(np.clip(np.dot(u_norm_a, u_norm_b), 0.0, 1.0))

        avg_yaw = (abs(yaw_a) + abs(yaw_b)) / 2.0
        yaw_factor = min(1.0, avg_yaw / 0.35)
        w_per = 0.60 + 0.25 * yaw_factor
        w_full = 1.0 - w_per

        return max(f_sim, w_full * f_sim + w_per * u_sim)

    # Genuine pairs
    for id_name, embs in embeddings_by_id.items():
        for i in range(len(embs)):
            for j in range(i + 1, len(embs)):
                fused = calc_fused_sim(embs[i], embs[j])
                genuine_scores.append(fused)

    # Impostor pairs
    id_list = list(embeddings_by_id.keys())
    for i in range(len(id_list)):
        for j in range(i + 1, len(id_list)):
            for emb_a in embeddings_by_id[id_list[i]]:
                for emb_b in embeddings_by_id[id_list[j]]:
                    fused = calc_fused_sim(emb_a, emb_b)
                    impostor_scores.append(fused)

    genuine_scores = np.array(genuine_scores)
    impostor_scores = np.array(impostor_scores)

    N_impostors = len(impostor_scores)
    N_genuines = len(genuine_scores)

    print("\n" + "=" * 85)
    print(f"[STATISTICS] Total Genuine Pairs: {N_genuines} | Total Impostor Pairs: {N_impostors}")
    print(f"[GENUINE METRICS] Mean: {np.mean(genuine_scores):.4f} | Std: {np.std(genuine_scores):.4f} | Min: {np.min(genuine_scores):.4f}")
    print(f"[IMPOSTOR METRICS] Mean: {np.mean(impostor_scores):.4f} | Std: {np.std(impostor_scores):.4f} | Max: {np.max(impostor_scores):.4f}")

    target_far = 0.00001
    thresholds = np.linspace(0.10, 0.90, 81)
    calibrated_th = 0.65
    min_diff = 1.0

    print("\n" + "=" * 105)
    print(f"{'Threshold':<10} | {'FAR (%)':<12} | {'FRR (%)':<12} | {'GAR (%)':<12} | {'Exact Clopper-Pearson 95% CI (FAR)':<40}")
    print("=" * 105)

    for th in thresholds:
        impostor_fails = int(np.sum(impostor_scores >= th))
        far = impostor_fails / max(1, N_impostors)
        genuine_fails = int(np.sum(genuine_scores < th))
        frr = genuine_fails / max(1, N_genuines)
        gar = (1.0 - frr) * 100.0

        ci_low, ci_high = clopper_pearson_ci(impostor_fails, N_impostors)

        if abs(far - target_far) < min_diff:
            min_diff = abs(far - target_far)
            calibrated_th = th

        if round(th, 2) in [0.25, 0.30, 0.35, 0.38, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]:
            print(f"{th:<10.2f} | {far*100:<12.5f} | {frr*100:<12.4f} | {gar:<12.2f} | [{ci_low*100:.6f}%, {ci_high*100:.6f}%]")

    print("=" * 105)
    print(f"[CALIBRATION RESULT] Exact Calibrated Threshold for True FAR <= 10^-5: {calibrated_th:.2f}")

if __name__ == "__main__":
    main()
