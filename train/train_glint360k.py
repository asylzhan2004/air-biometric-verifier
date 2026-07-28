"""
Glint360K SOTA ArcFace GPU Training Script (Pure PyTorch & 4-Byte Aligned Parser)
Trains InceptionResnetV1 with ArcFace (s=64.0, m=0.50) directly from train.rec.
Outputs models/finetuned_kyc_arcface.pth.
"""
import os
import sys
import io
import time
import struct
import PIL.Image
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from facenet_pytorch import InceptionResnetV1
from model import ArcMarginProduct

# Enable UTF-8 encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

class Glint360kRecordDataset(Dataset):
    def __init__(self, rec_path, max_records=500000):
        print(f"[DATASET INDEXER] Indexing record offsets from {rec_path}...")
        self.rec_path = rec_path
        self.records = []
        
        transform_pipeline = transforms.Compose([
            transforms.Resize((160, 160)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        ])
        self.transform = transform_pipeline

        # Build index of valid record byte offsets with 4-byte alignment
        with open(rec_path, 'rb') as f:
            while len(self.records) < max_records:
                offset = f.tell()
                hdr_bytes = f.read(8)
                if len(hdr_bytes) < 8:
                    break
                magic, cflag = struct.unpack('<II', hdr_bytes)
                if magic != 0xced7230a:
                    break
                rec_len = cflag & 0x00FFFFFF
                self.records.append((offset + 8, rec_len))
                
                pad = (4 - (rec_len % 4)) % 4
                f.seek(rec_len + pad, 1)

        print(f"[DATASET INDEXED] Ready with {len(self.records)} images from Glint360K.")

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        data_offset, rec_len = self.records[idx]
        with open(self.rec_path, 'rb') as f:
            f.seek(data_offset)
            data = f.read(rec_len)

        jpeg_pos = data.find(b'\xff\xd8\xff')
        if jpeg_pos != -1:
            try:
                hdr = data[:jpeg_pos]
                label_val = abs(struct.unpack('<i', hdr[4:8])[0]) % 10000 if len(hdr) >= 8 else 0
                img = PIL.Image.open(io.BytesIO(data[jpeg_pos:])).convert('RGB')
                tensor_img = self.transform(img)
                return tensor_img, label_val
            except Exception:
                pass
                
        return torch.zeros((3, 160, 160)), 0


def train_glint():
    print("=" * 85)
    print("[START] Glint360K SOTA ArcFace GPU Training (s=64.0, m=0.50)")
    print("=" * 85)

    rec_path = r"X:\big dataset\glint360k_unpacked\glint360k\train.rec"
    if not os.path.exists(rec_path):
        print(f"[ERROR] {rec_path} not found!")
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[DEVICE] Hardware Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    dataset = Glint360kRecordDataset(rec_path, max_records=500000)
    dataloader = DataLoader(
        dataset,
        batch_size=64,
        shuffle=True,
        num_workers=0,
        pin_memory=True
    )

    backbone = InceptionResnetV1(pretrained='vggface2').train().to(device)
    save_path = "models/finetuned_kyc_arcface.pth"

    if os.path.exists(save_path):
        try:
            state = torch.load(save_path, map_location=device, weights_only=False)
            backbone.load_state_dict(state, strict=False)
            print(f"[RESUME] Loaded existing checkpoint from {save_path}")
        except Exception as e:
            print(f"[WARNING] Could not load checkpoint: {e}")

    num_classes = 10000
    margin_loss = ArcMarginProduct(in_features=512, out_features=num_classes, s=64.0, m=0.50).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        list(backbone.parameters()) + list(margin_loss.parameters()),
        lr=0.0001,
        weight_decay=0.0001
    )

    start_time = time.time()
    epochs = 5

    for epoch in range(1, epochs + 1):
        backbone.train()
        margin_loss.train()
        total_loss = 0.0
        correct = 0
        total = 0
        step = 0

        for images, labels in dataloader:
            step += 1
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            features = backbone(images)
            features_norm = features / torch.norm(features, p=2, dim=1, keepdim=True)
            outputs = margin_loss(features_norm, labels)

            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            if step % 100 == 0:
                print(f"Glint360K Epoch [{epoch:02d}/{epochs:02d}] Step [{step}/{len(dataloader)}] | Loss: {loss.item():.4f} | Time: {round(time.time() - start_time, 1)}s")
                torch.save(backbone.state_dict(), save_path)

        epoch_loss = total_loss / max(1, total)
        epoch_acc = (correct / max(1, total)) * 100.0
        print(f"--> Glint360K Epoch [{epoch:02d}/{epochs:02d}] Finished | Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}%")
        torch.save(backbone.state_dict(), save_path)

    print(f"[SUCCESS] Glint360K GPU Fine-Tuning Complete in {round(time.time() - start_time, 1)} sec!")

if __name__ == "__main__":
    train_glint()
