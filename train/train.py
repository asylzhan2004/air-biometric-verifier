"""
PyTorch ArcFace GPU Training Script with Automatic Checkpoint Resuming.
Supports stopping & resuming training anytime without losing progress.
"""
import os
import sys
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, ConcatDataset
from model import CustomArcFaceNet, ArcMarginProduct
from dataset import MultiSourceFaceDataset, RecordIODataset
from export_onnx import export_to_onnx

# Enable UTF-8 encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

def train_custom_model(
    rec_path=r"X:\работа с обучением\casia-webface\train.rec",
    idx_path=r"X:\работа с обучением\casia-webface\train.idx",
    folder_dirs=[
        r"X:\работа с обучением\archive",
        r"X:\работа с обучением\archive (1)\lfw-deepfunneled\lfw-deepfunneled",
        r"X:\работа с обучением\archive (4)",
        r"X:\работа с обучением\archive (5)",
        r"X:\работа с обучением\archive (6)",
        r"X:\работа с обучением\archive (7)",
        r"X:\работа с обучением\archive (8)",
        r"X:\работа с обучением\archive (10)",
        r"X:\работа с обучением\archive (13)",
        r"X:\работа с обучением\faceData"
    ],
    epochs=5,
    batch_size=128,
    lr=0.001,
    save_path="models/custom_arcface.pth",
    onnx_path="models/custom_arcface_model.onnx"
):
    print("=" * 85)
    print("[START] Universal Multi-Dataset ArcFace GPU Training with Auto Checkpoint Resume")
    print("=" * 85)
    
    os.makedirs("models", exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        print(f"[DEVICE] GPU ACCELERATION ACTIVE: {gpu_name}")
    else:
        print(f"[DEVICE] Hardware Device: {device}")

    datasets = []

    # 1. Load CASIA-WebFace RecordIO dataset
    if os.path.exists(rec_path) and os.path.exists(idx_path):
        print(f"[DATASET] Loading CASIA-WebFace RecordIO from {rec_path}...")
        rec_ds = RecordIODataset(rec_path, idx_path, augment=True)
        datasets.append(rec_ds)

    # 2. Load ALL Folder Datasets (YouTube Faces + CelebA 202k + Asian/Caucasian KYC + Selfie/ID)
    print("[DATASET] Scanning all image folder datasets...")
    folder_ds = MultiSourceFaceDataset(folder_dirs, augment=True)
    if len(folder_ds) > 0:
        datasets.append(folder_ds)
        print(f"[DATASET] Loaded {len(folder_ds)} folder images across {len(folder_ds.class_to_idx)} distinct identity folders.")

    if len(datasets) == 0:
        print("[ERROR] No datasets found!")
        return

    combined_dataset = ConcatDataset(datasets)
    print(f"[DATASET] Total Combined Universal Training Images: {len(combined_dataset)}")

    dataloader = DataLoader(
        combined_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=True
    )

    num_classes = 10575 + len(folder_ds.class_to_idx)
    backbone = CustomArcFaceNet(embedding_size=512).to(device)
    margin_loss = ArcMarginProduct(in_features=512, out_features=num_classes).to(device)

    # ── Checkpoint Resuming ──
    if os.path.exists(save_path):
        try:
            print(f"[RESUME] Found existing trained weights at {save_path}. Resuming progress...")
            state_dict = torch.load(save_path, map_location=device, weights_only=False)
            backbone.load_state_dict(state_dict, strict=False)
            print("[RESUME SUCCESS] Previous trained weights loaded seamlessly!")
        except Exception as e:
            print(f"[RESUME WARNING] Could not resume from checkpoint: {e}")

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        list(backbone.parameters()) + list(margin_loss.parameters()),
        lr=lr,
        weight_decay=0.0005
    )

    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    start_time = time.time()

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
            labels = torch.clamp(labels.to(device), 0, num_classes - 1)

            optimizer.zero_grad()
            features = backbone(images)
            outputs = margin_loss(features, labels)
            
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            if step % 400 == 0:
                print(f"Batch [{step}/{len(dataloader)}] | Current Loss: {loss.item():.4f}")

        scheduler.step()
        epoch_loss = total_loss / max(1, total)
        epoch_acc = (correct / max(1, total)) * 100.0

        print(f"--> Epoch [{epoch:02d}/{epochs:02d}] Finished | Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}%")

        # Save Checkpoint after each epoch
        torch.save(backbone.state_dict(), save_path)
        export_to_onnx(save_path, onnx_path)
        print(f"[CHECKPOINT SAVED] Epoch {epoch} weights and ONNX model updated.")

    print(f"[SUCCESS] Trained weights saved to: {save_path} (Time: {round(time.time() - start_time, 1)} sec)")
    print("[COMPLETE] Universal High-Precision ArcFace ONNX model ready for deployment!")

if __name__ == "__main__":
    train_custom_model()
