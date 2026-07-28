"""
SOTA Fine-Tuning with RWMFD (Masked Faces), AgeDB, MIDV-500 & Multi-Source KYC Datasets:
- Real-World Masked Face Dataset (Real-World-Masked-Face-Dataset-master)
- AgeDB Dataset (archive (18))
- MIDV-500 Identity Documents Dataset (midv500-master)
- Portrait and 30 Photos Dataset (archive (14))
- 105 Classes Pins Dataset (archive (16))
- KYC Datasets (archive (5), archive (6), archive (8), archive, archive (7))

Uses Pretrained SOTA InceptionResnetV1 (VGGFace2) with ArcFace s=64.0, m=0.50.
"""
import os
import sys
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from facenet_pytorch import InceptionResnetV1
from dataset import MultiSourceFaceDataset
from model import ArcMarginProduct

# Enable UTF-8 encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

def finetune_kyc(
    kyc_dirs=[
        r"X:\работа с обучением\Real-World-Masked-Face-Dataset-master",
        r"X:\работа с обучением\archive (18)",
        r"X:\работа с обучением\midv500-master",
        r"X:\работа с обучением\archive (14)",
        r"X:\работа с обучением\archive (16)",
        r"X:\работа с обучением\archive (5)",
        r"X:\работа с обучением\archive (6)",
        r"X:\работа с обучением\archive (7)",
        r"X:\работа с обучением\archive (8)",
        r"X:\работа с обучением\archive",
    ],
    epochs=5,
    batch_size=64,
    lr=0.0001,
    save_path="models/finetuned_kyc_arcface.pth"
):
    print("=" * 85)
    print("[START] SOTA Fine-Tuning with RWMFD Masked Faces, AgeDB, MIDV-500 & KYC Datasets")
    print("=" * 85)

    os.makedirs("models", exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[DEVICE] Hardware Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    # 1. Load Multi-Source Datasets
    dataset = MultiSourceFaceDataset(kyc_dirs, augment=True)
    if len(dataset) == 0:
        print("[ERROR] No datasets found!")
        return

    print(f"[DATASET] Loaded {len(dataset)} images across {len(dataset.class_to_idx)} distinct identity folders.")

    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=True
    )

    # 2. Pretrained SOTA Backbone (VGGFace2 / InceptionResnetV1)
    backbone = InceptionResnetV1(pretrained='vggface2').train().to(device)

    # Load existing fine-tuned weights if present to resume progress
    if os.path.exists(save_path):
        try:
            state = torch.load(save_path, map_location=device, weights_only=False)
            backbone.load_state_dict(state, strict=False)
            print(f"[RESUME] Loaded existing checkpoint from {save_path}")
        except Exception as e:
            print(f"[WARNING] Could not load checkpoint: {e}")

    # 3. SOTA ArcMargin Loss with s=64.0, m=0.50
    num_classes = len(dataset.class_to_idx)
    margin_loss = ArcMarginProduct(in_features=512, out_features=num_classes, s=64.0, m=0.50).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(
        list(backbone.parameters()) + list(margin_loss.parameters()),
        lr=lr,
        weight_decay=0.0001
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

            if step % 50 == 0:
                print(f"Batch [{step}/{len(dataloader)}] | Current Loss: {loss.item():.4f}")

        scheduler.step()
        epoch_loss = total_loss / max(1, total)
        epoch_acc = (correct / max(1, total)) * 100.0

        print(f"--> Epoch [{epoch:02d}/{epochs:02d}] Finished | Loss: {epoch_loss:.4f} | Accuracy: {epoch_acc:.2f}%")

        # Save Checkpoint after each epoch
        torch.save(backbone.state_dict(), save_path)
        print(f"[CHECKPOINT SAVED] Epoch {epoch} weights saved at {save_path}.")

    print(f"[SUCCESS] Multi-Dataset Fine-Tuning Complete in {round(time.time() - start_time, 1)} sec!")

if __name__ == "__main__":
    finetune_kyc()
