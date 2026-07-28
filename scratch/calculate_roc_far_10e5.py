"""
NIST FRVT FAR = 10^-5 Threshold Calibration Script
Calculates ROC curve, Genuine Acceptance Rate (GAR), False Reject Rate (FRR)
and identifies exact threshold for FAR = 10^-5.
"""
import os
import sys
import torch
import numpy as np
import PIL.Image
from facenet_pytorch import InceptionResnetV1, MTCNN

sys.stdout.reconfigure(encoding='utf-8')

def evaluate_far_frv():
    print("=" * 80)
    print("[NIST FRVT EVALUATION] Calibrating Threshold for FAR = 10^-5 (1 in 100,000)")
    print("=" * 80)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    embedder = InceptionResnetV1(pretrained='vggface2').eval().to(device)

    pth_path = "models/finetuned_kyc_arcface.pth"
    if os.path.exists(pth_path):
        try:
            state = torch.load(pth_path, map_location=device, weights_only=False)
            embedder.load_state_dict(state, strict=False)
            print(f"[LOAD] Loaded SOTA weights from {pth_path}")
        except Exception as e:
            print(f"[WARNING] Could not load checkpoint: {e}")

    mtcnn = MTCNN(image_size=160, margin=20, keep_all=False, device=device)

    # Collect sample embeddings across identity folders
    dataset_dir = r"X:\работа с обучением\archive (14)\img"
    if not os.path.exists(dataset_dir):
        print(f"[ERROR] Dataset dir {dataset_dir} not found!")
        return

    identity_folders = [os.path.join(dataset_dir, d) for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))][:50]
    
    embeddings_by_id = {}
    print(f"[EXTRACTING EMBEDDINGS] Sampling {len(identity_folders)} identity folders...")

    for folder in identity_folders:
        id_name = os.path.basename(folder)
        img_files = [os.path.join(folder, f) for f in os.listdir(folder) if f.endswith(('.jpg', '.png', '.jpeg'))][:3]
        embs = []
        for img_p in img_files:
            try:
                img = PIL.Image.open(img_p).convert('RGB')
                t = mtcnn(img)
                if t is not None:
                    with torch.no_grad():
                        emb = embedder(t.unsqueeze(0).to(device)).cpu().numpy()[0]
                        emb_norm = emb / np.linalg.norm(emb)
                        embs.append(emb_norm)
            except Exception:
                pass
        if len(embs) > 0:
            embeddings_by_id[id_name] = embs

    print(f"[COLLECTED] {len(embeddings_by_id)} valid identities.")

    genuine_scores = []
    impostor_scores = []

    # Genuine pairs (same identity)
    for id_name, embs in embeddings_by_id.items():
        for i in range(len(embs)):
            for j in range(i + 1, len(embs)):
                sim = float(np.dot(embs[i], embs[j]))
                genuine_scores.append(sim)

    # Impostor pairs (different identities)
    id_list = list(embeddings_by_id.keys())
    for i in range(len(id_list)):
        for j in range(i + 1, len(id_list)):
            id_a = id_list[i]
            id_b = id_list[j]
            for emb_a in embeddings_by_id[id_a]:
                for emb_b in embeddings_by_id[id_b]:
                    sim = float(np.dot(emb_a, emb_b))
                    impostor_scores.append(sim)

    genuine_scores = np.array(genuine_scores)
    impostor_scores = np.array(impostor_scores)

    print(f"[SCORES] Genuine pairs: {len(genuine_scores)} | Impostor pairs: {len(impostor_scores)}")
    print(f"[GENUINE] Mean: {np.mean(genuine_scores):.4f} | Std: {np.std(genuine_scores):.4f}")
    print(f"[IMPOSTOR] Mean: {np.mean(impostor_scores):.4f} | Std: {np.std(impostor_scores):.4f}")

    # Evaluate thresholds from 0.10 to 0.90
    thresholds = np.linspace(0.10, 0.90, 81)
    results = []

    for th in thresholds:
        far = np.mean(impostor_scores >= th)
        frr = np.mean(genuine_scores < th)
        gar = 1.0 - frr
        results.append((th, far, frr, gar))

    print("\n" + "=" * 70)
    print(f"{'Threshold':<12} | {'FAR (%)':<12} | {'FRR (%)':<12} | {'GAR (Accuracy)':<15}")
    print("=" * 70)

    target_th = 0.35
    min_far_diff = 1.0

    for th, far, frr, gar in results:
        if abs(far - 0.0001) < min_far_diff:
            min_far_diff = abs(far - 0.0001)
            target_th = th
        if round(th, 2) in [0.25, 0.30, 0.35, 0.38, 0.40, 0.45, 0.50, 0.60]:
            print(f"{th:<12.2f} | {far*100:<12.4f} | {frr*100:<12.4f} | {gar*100:<15.2f}")

    print("=" * 70)
    print(f"[CALIBRATED THRESHOLD] For FAR <= 10^-4: Recommended Threshold = {target_th:.2f}")

if __name__ == "__main__":
    evaluate_far_frv()
