"""
Test live /api/v1/biometrics/search HTTP endpoint with requests to inspect exact returned JSON.
"""
import os
import sys
import requests

sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=" * 80)
    print("[HTTP SEARCH TEST] Testing live FastAPI /api/v1/biometrics/search response...")
    print("=" * 80)

    dataset_dir = r"X:\работа с обучением\archive (14)\img"
    folders = [os.path.join(dataset_dir, d) for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))][:2]

    img_files = [os.path.join(folders[0], f) for f in os.listdir(folders[0]) if f.endswith(('.jpg', '.png'))][:2]
    other_img = [os.path.join(folders[1], f) for f in os.listdir(folders[1]) if f.endswith(('.jpg', '.png'))][0]

    url = "http://127.0.0.1:8000/api/v1/biometrics/search"

    files = [
        ('live_frame', ('target.jpg', open(img_files[0], 'rb'), 'image/jpeg')),
        ('documents', ('match_same_person.jpg', open(img_files[1], 'rb'), 'image/jpeg')),
        ('documents', ('impostor_other_person.jpg', open(other_img, 'rb'), 'image/jpeg'))
    ]

    res = requests.post(url, files=files)
    print(f"HTTP Status Code: {res.status_code}")
    data = res.json()

    print("\n--- RETURNED JSON RESPONSE ---")
    print(f"Status: {data.get('status')}")
    print(f"Verified: {data.get('verified')}")
    print(f"Gate: {data.get('gate')}")
    
    print("\nAll Document Scores:")
    for doc in data.get('allDocumentScores', []):
        print(f" - [{doc.get('filename')}] | RawSim: {doc.get('rawSimilarity'):.4f} | Matched: {doc.get('matched')} | BestMatch: {doc.get('isBestMatch')} | Deepfake: {doc.get('deepfakeDetected')}")

    print("=" * 80)

if __name__ == "__main__":
    main()
