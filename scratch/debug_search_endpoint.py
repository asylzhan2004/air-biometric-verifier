"""
Debug script for /api/v1/biometrics/search endpoint logic.
"""
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.biometrics import extract_dual_embeddings, calculate_quality_score, QUALITY_FLOOR, BASE_THRESHOLD, STRICT_LOW_QUALITY_THRESHOLD, QUALITY_STRICT_ZONE

def test_search_logic():
    print("=" * 80)
    print("[DEBUG SEARCH LOGIC] Auditing variables in search match logic...")
    print("=" * 80)

    dataset_dir = r"X:\работа с обучением\archive (14)\img"
    folders = [os.path.join(dataset_dir, d) for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))][:2]

    if len(folders) < 2:
        print("[ERROR] Folders not found")
        return

    # Pick two photos of the SAME person
    img_files = [os.path.join(folders[0], f) for f in os.listdir(folders[0]) if f.endswith(('.jpg', '.png'))][:2]
    if len(img_files) < 2:
        print("[ERROR] 2 images of same person not found")
        return

    with open(img_files[0], 'rb') as f:
        doc_bytes = f.read()

    with open(img_files[1], 'rb') as f:
        live_bytes = f.read()

    live_full, live_upper, quality_live, timing_live, df_live = extract_dual_embeddings(live_bytes, is_document=False)
    doc_full, doc_upper, quality_doc, timing_doc, df_doc = extract_dual_embeddings(doc_bytes, is_document=True)

    import numpy as np
    full_sim = float(np.clip(np.dot(doc_full, live_full), 0.0, 1.0))
    upper_sim = float(np.clip(np.dot(doc_upper, live_upper), 0.0, 1.0))
    fused_sim = max(full_sim, 0.40 * full_sim + 0.60 * upper_sim)

    q_pair = (quality_doc["overallQuality"] + quality_live["overallQuality"]) / 2.0
    q_ok = not (q_pair < QUALITY_FLOOR and fused_sim < 0.55)

    adaptive_thresh = STRICT_LOW_QUALITY_THRESHOLD if q_pair < QUALITY_STRICT_ZONE else BASE_THRESHOLD
    df_det = df_doc.get("isDeepfake", False) or df_live.get("isDeepfake", False)

    print(f"Fused Similarity: {fused_sim:.4f}")
    print(f"Adaptive Threshold: {adaptive_thresh}")
    print(f"Quality Floor Passed (q_ok): {q_ok}")
    print(f"DF Doc isDeepfake: {df_doc.get('isDeepfake', False)} (aiProb: {df_doc.get('aiProbability', 0.0)})")
    print(f"DF Live isDeepfake: {df_live.get('isDeepfake', False)} (aiProb: {df_live.get('aiProbability', 0.0)})")
    print(f"Deepfake Detected (df_det): {df_det}")

    is_match = (fused_sim >= adaptive_thresh) and q_ok and not df_det
    print(f"--> FINAL MATCHED STATUS: {is_match}")
    print("=" * 80)

if __name__ == "__main__":
    test_search_logic()
