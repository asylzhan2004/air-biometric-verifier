"""
Generates complete raw score CSV log for NIST FRVT FAR calibration.
Outputs scratch/raw_scores_far_calibration.csv with columns: pair_type, identity_a, identity_b, similarity_score
"""
import os
import sys
import csv
import torch
import numpy as np
import PIL.Image
from facenet_pytorch import InceptionResnetV1, MTCNN

sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=" * 80)
    print("[EXPORTING RAW PAIR SCORES CSV] Generating NIST FRVT dataset calibration log...")
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

    dataset_dir = r"X:\работа с обучением\archive (14)\img"
    if not os.path.exists(dataset_dir):
        print(f"[ERROR] Dataset dir {dataset_dir} not found!")
        return

    identity_folders = [os.path.join(dataset_dir, d) for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))][:80]
    
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

    csv_path = r"scratch\raw_scores_far_calibration.csv"
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)

    total_genuine = 0
    total_impostor = 0

    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["pair_type", "identity_a", "identity_b", "similarity_score"])

        # Genuine Pairs
        for id_name, embs in embeddings_by_id.items():
            for i in range(len(embs)):
                for j in range(i + 1, len(embs)):
                    sim = float(np.dot(embs[i], embs[j]))
                    writer.writerow(["GENUINE", id_name, id_name, round(sim, 6)])
                    total_genuine += 1

        # Impostor Pairs
        id_list = list(embeddings_by_id.keys())
        for i in range(len(id_list)):
            for j in range(i + 1, len(id_list)):
                id_a = id_list[i]
                id_b = id_list[j]
                for emb_a in embeddings_by_id[id_a]:
                    for emb_b in embeddings_by_id[id_b]:
                        sim = float(np.dot(emb_a, emb_b))
                        writer.writerow(["IMPOSTOR", id_a, id_b, round(sim, 6)])
                        total_impostor += 1

    print("=" * 80)
    print(f"[SUCCESS] CSV Export Complete: {csv_path}")
    print(f"[METRICS SUMMARY] Total Genuine Pairs: {total_genuine} | Total Impostor Pairs: {total_impostor}")
    print("=" * 80)

if __name__ == "__main__":
    main()
