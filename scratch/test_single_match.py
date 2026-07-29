import os, requests, time
time.sleep(4)

dataset_dir = r'X:\работа с обучением\archive (14)\img'
folders = [os.path.join(dataset_dir, d) for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))][:3]

img_live = [os.path.join(folders[0], f) for f in os.listdir(folders[0]) if f.endswith(('.jpg', '.png'))][0]
img_doc1 = [os.path.join(folders[0], f) for f in os.listdir(folders[0]) if f.endswith(('.jpg', '.png'))][1]
img_doc2 = [os.path.join(folders[1], f) for f in os.listdir(folders[1]) if f.endswith(('.jpg', '.png'))][0]
img_doc3 = [os.path.join(folders[2], f) for f in os.listdir(folders[2]) if f.endswith(('.jpg', '.png'))][0]

files = [
    ('documents', ('DOC_SAME.jpg', open(img_doc1, 'rb'), 'image/jpeg')),
    ('documents', ('DOC_OTHER1.jpg', open(img_doc2, 'rb'), 'image/jpeg')),
    ('documents', ('DOC_OTHER2.jpg', open(img_doc3, 'rb'), 'image/jpeg')),
    ('live_frame', ('LIVE.jpg', open(img_live, 'rb'), 'image/jpeg'))
]

r = requests.post('http://127.0.0.1:8000/api/v1/biometrics/search', files=files)
data = r.json()
print('STATUS:', data.get('status'))
print('GATE:', data.get('gate'))
print()
for doc in data.get('allDocumentScores', []):
    fname = doc['filename']
    sim = doc['rawSimilarity'] * 100
    matched = doc.get('matched')
    is_best = doc.get('isBestMatch')
    print(f'  {fname}: Sim={sim:.1f}% | matched={matched} | isBestMatch={is_best}')
