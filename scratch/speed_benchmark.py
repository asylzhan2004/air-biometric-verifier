"""Speed benchmark: measures actual wall-clock time for /api/v1/biometrics/search"""
import os, requests, time

time.sleep(4)

dataset_dir = r'X:\работа с обучением\archive (14)\img'
folders = [os.path.join(dataset_dir, d) for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))][:3]

img_live = [os.path.join(folders[0], f) for f in os.listdir(folders[0]) if f.endswith(('.jpg', '.png'))][0]
img_doc1 = [os.path.join(folders[0], f) for f in os.listdir(folders[0]) if f.endswith(('.jpg', '.png'))][1]
img_doc2 = [os.path.join(folders[1], f) for f in os.listdir(folders[1]) if f.endswith(('.jpg', '.png'))][0]
img_doc3 = [os.path.join(folders[2], f) for f in os.listdir(folders[2]) if f.endswith(('.jpg', '.png'))][0]

# Warmup request (first request loads models)
print("=== WARMUP (first request loads models into GPU) ===")
files = [
    ('documents', ('doc1.jpg', open(img_doc1, 'rb'), 'image/jpeg')),
    ('live_frame', ('live.jpg', open(img_live, 'rb'), 'image/jpeg'))
]
t0 = time.time()
r = requests.post('http://127.0.0.1:8000/api/v1/biometrics/search', files=files)
warmup_ms = round((time.time() - t0) * 1000)
print(f"Warmup: {warmup_ms} ms (includes model loading)")

# Real benchmark: 3 documents
print("\n=== BENCHMARK: Search across 3 documents ===")
files = [
    ('documents', ('doc1.jpg', open(img_doc1, 'rb'), 'image/jpeg')),
    ('documents', ('doc2.jpg', open(img_doc2, 'rb'), 'image/jpeg')),
    ('documents', ('doc3.jpg', open(img_doc3, 'rb'), 'image/jpeg')),
    ('live_frame', ('live.jpg', open(img_live, 'rb'), 'image/jpeg'))
]
t0 = time.time()
r = requests.post('http://127.0.0.1:8000/api/v1/biometrics/search', files=files)
search_ms = round((time.time() - t0) * 1000)
data = r.json()
server_ms = data.get('processTimeMs', '?')
print(f"Client wall-clock: {search_ms} ms")
print(f"Server processTimeMs: {server_ms} ms")
print(f"Status: {data.get('status')}")
print(f"Verified: {data.get('verified')}")
for doc in data.get('allDocumentScores', []):
    fname = doc['filename']
    sim = doc['rawSimilarity'] * 100
    matched = doc.get('matched')
    cached = doc.get('profilingBreakdown', {}).get('docTiming', {}).get('fromCache', False)
    print(f"  {fname}: Sim={sim:.1f}% matched={matched} cached={cached}")

# Second call (documents now cached)
print("\n=== BENCHMARK: Repeat search (documents cached) ===")
files = [
    ('documents', ('doc1.jpg', open(img_doc1, 'rb'), 'image/jpeg')),
    ('documents', ('doc2.jpg', open(img_doc2, 'rb'), 'image/jpeg')),
    ('documents', ('doc3.jpg', open(img_doc3, 'rb'), 'image/jpeg')),
    ('live_frame', ('live.jpg', open(img_live, 'rb'), 'image/jpeg'))
]
t0 = time.time()
r = requests.post('http://127.0.0.1:8000/api/v1/biometrics/search', files=files)
cached_ms = round((time.time() - t0) * 1000)
data = r.json()
server_ms = data.get('processTimeMs', '?')
print(f"Client wall-clock: {cached_ms} ms")
print(f"Server processTimeMs: {server_ms} ms")
for doc in data.get('allDocumentScores', []):
    fname = doc['filename']
    cached = doc.get('profilingBreakdown', {}).get('docTiming', {}).get('fromCache', False)
    print(f"  {fname}: cached={cached}")
