"""
Multi-Dataset SOTA Anti-DeepFake & Anti-Spoofing Classifier Training Script
Trains a ResNet18 Binary Classifier (Real Photo vs AI / Spoof Image) combining:
1. CelebA_Spoof Dataset (X:\\работа с обучением\\archive\\CelebA_Spoof_\\CelebA_Spoof\\Data) - 150,000 sampled images
2. SiW Dataset (X:\\работа с обучением\\archive (21)\\SiW) - 7,586 images
3. Real vs AI Dataset (X:\\работа с обучением\\archive (20)\\my_real_vs_ai_dataset) - 100,000 images

Outputs models/anti_deepfake_classifier.pth.
"""
import os
import sys
import time
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, models
import PIL.Image

sys.stdout.reconfigure(encoding='utf-8')

class UltimateAntiSpoofDataset(Dataset):
    def __init__(self, real_ai_dir, siw_dir, celeba_dir, max_celeba_samples=150000, transform=None):
        self.image_paths = []
        self.labels = [] # 0: Real / Live, 1: AI / Spoof / Replay

        if transform is None:
            self.transform = transforms.Compose([
                transforms.Resize((160, 160)),
                transforms.RandomHorizontalFlip(),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
        else:
            self.transform = transform

        # 1. CelebA_Spoof Dataset
        if os.path.exists(celeba_dir):
            print(f"[DATASET ENHANCEMENT 1/3] Indexing CelebA_Spoof dataset from {celeba_dir}...")
            c_added = 0
            for root, dirs, files in os.walk(celeba_dir):
                for f in files:
                    if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                        full_path = os.path.join(root, f)
                        if full_path.endswith('_BB.txt'):
                            continue
                        path_lower = full_path.lower()
                        if "live" in path_lower or "real" in path_lower:
                            self.image_paths.append(full_path)
                            self.labels.append(0)
                        else:
                            self.image_paths.append(full_path)
                            self.labels.append(1)
                        c_added += 1
                        if c_added >= max_celeba_samples:
                            break
                if c_added >= max_celeba_samples:
                    break
            print(f"[LOADED] CelebA_Spoof: {c_added} images.")

        # 2. SiW Dataset
        if os.path.exists(siw_dir):
            print(f"[DATASET ENHANCEMENT 2/3] Indexing SiW Anti-Spoofing dataset from {siw_dir}...")
            siw_added = 0
            for root, dirs, files in os.walk(siw_dir):
                for f in files:
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                        full_path = os.path.join(root, f)
                        path_lower = full_path.lower()
                        if "live" in path_lower or "real" in path_lower:
                            self.image_paths.append(full_path)
                            self.labels.append(0)
                        else:
                            self.image_paths.append(full_path)
                            self.labels.append(1)
                        siw_added += 1
            print(f"[LOADED] SiW: {siw_added} images.")

        # 3. Real vs AI Dataset
        if os.path.exists(real_ai_dir):
            print(f"[DATASET ENHANCEMENT 3/3] Indexing Real vs AI dataset from {real_ai_dir}...")
            real_dir = os.path.join(real_ai_dir, "real")
            ai_dir = os.path.join(real_ai_dir, "ai_images")
            ai_added = 0

            if os.path.exists(real_dir):
                for dp, dn, filenames in os.walk(real_dir):
                    for f in filenames[:25000]:
                        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                            self.image_paths.append(os.path.join(dp, f))
                            self.labels.append(0)
                            ai_added += 1

            if os.path.exists(ai_dir):
                for dp, dn, filenames in os.walk(ai_dir):
                    for f in filenames[:25000]:
                        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                            self.image_paths.append(os.path.join(dp, f))
                            self.labels.append(1)
                            ai_added += 1
            print(f"[LOADED] Real vs AI: {ai_added} images.")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        path = self.image_paths[idx]
        label = self.labels[idx]
        try:
            img = PIL.Image.open(path).convert('RGB')
            tensor_img = self.transform(img)
            return tensor_img, label
        except Exception:
            return torch.zeros((3, 160, 160)), label


def train_anti_deepfake(
    real_ai_dir=r"X:\работа с обучением\archive (20)\my_real_vs_ai_dataset\my_real_vs_ai_dataset",
    siw_dir=r"X:\работа с обучением\archive (21)\SiW",
    celeba_dir=r"X:\работа с обучением\archive\CelebA_Spoof_\CelebA_Spoof\Data",
    epochs=3,
    batch_size=64,
    lr=0.00005,
    save_path="models/anti_deepfake_classifier.pth"
):
    print("=" * 90)
    print("[START] Ultimate Multi-Dataset Anti-DeepFake & Anti-Spoofing Classifier Training")
    print("=" * 90)

    os.makedirs("models", exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[DEVICE] Hardware Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    dataset = UltimateAntiSpoofDataset(real_ai_dir, siw_dir, celeba_dir)
    if len(dataset) == 0:
        print("[ERROR] No images found!")
        return

    print(f"\n[DATASET TOTAL] Loaded {len(dataset)} TOTAL IMAGES (Real Photos + AI + SiW + CelebA_Spoof).")

    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=True
    )

    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    model.fc = nn.Linear(model.fc.in_features, 2)
    model = model.to(device)

    if os.path.exists(save_path):
        try:
            state = torch.load(save_path, map_location=device, weights_only=False)
            model.load_state_dict(state, strict=False)
            print(f"[RESUME] Loaded baseline Anti-DeepFake weights from {save_path}")
        except Exception as e:
            print(f"[WARNING] Could not load checkpoint: {e}")

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.0001)

    start_time = time.time()

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        step = 0

        for images, labels in dataloader:
            step += 1
            images = images.to(device)
            labels = labels.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

            if step % 100 == 0:
                print(f"Epoch [{epoch:02d}/{epochs:02d}] Step [{step}/{len(dataloader)}] | Loss: {loss.item():.4f} | Accuracy: {(correct / max(1, total))*100.0:.2f}% | Time: {round(time.time() - start_time, 1)}s")
                torch.save(model.state_dict(), save_path)

        epoch_loss = total_loss / max(1, total)
        epoch_acc = (correct / max(1, total)) * 100.0

        print(f"--> Epoch [{epoch:02d}/{epochs:02d}] Finished | Loss: {epoch_loss:.4f} | Ultimate Anti-Spoof Accuracy: {epoch_acc:.2f}%")
        torch.save(model.state_dict(), save_path)
        print(f"[CHECKPOINT SAVED] Updated Anti-DeepFake weights saved at {save_path}.")

    print(f"[SUCCESS] Ultimate Anti-DeepFake & CelebA_Spoof Fine-Tuning Complete in {round(time.time() - start_time, 1)} sec!")

if __name__ == "__main__":
    train_anti_deepfake()
