"""
Anti-DeepFake & Anti-Spoofing Classifier Fine-Tuning Script:
Trains a ResNet18 Binary Classifier on Real Photos vs AI / Spoof Images
combining:
- archive (20) / my_real_vs_ai_dataset (200,000 Real vs AI images)
- archive (21) / SiW (Spoofing in the Wild: Live vs Screen/Print Spoof)
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

class CombinedAntiDeepFakeDataset(Dataset):
    def __init__(self, real_ai_dir, siw_dir, transform=None):
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

        # 1. Load Real vs AI dataset from archive (20)
        if os.path.exists(real_ai_dir):
            real_dir = os.path.join(real_ai_dir, "real")
            ai_dir = os.path.join(real_ai_dir, "ai_images")

            if os.path.exists(real_dir):
                for dp, dn, filenames in os.walk(real_dir):
                    for f in filenames:
                        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                            self.image_paths.append(os.path.join(dp, f))
                            self.labels.append(0)

            if os.path.exists(ai_dir):
                for dp, dn, filenames in os.walk(ai_dir):
                    for f in filenames:
                        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                            self.image_paths.append(os.path.join(dp, f))
                            self.labels.append(1)

        # 2. Load SiW Spoofing dataset from archive (21)
        if os.path.exists(siw_dir):
            print(f"[DATASET ENHANCEMENT] Loading SiW Anti-Spoofing dataset from {siw_dir}...")
            for dp, dn, filenames in os.walk(siw_dir):
                for f in filenames:
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
                        full_path = os.path.join(dp, f)
                        # Check path label in SiW structure: live (0) vs spoof / replay (1)
                        path_lower = full_path.lower()
                        if "live" in path_lower or "real" in path_lower:
                            self.image_paths.append(full_path)
                            self.labels.append(0)
                        else:
                            self.image_paths.append(full_path)
                            self.labels.append(1)

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
    epochs=3,
    batch_size=64,
    lr=0.00005,
    save_path="models/anti_deepfake_classifier.pth"
):
    print("=" * 85)
    print("[START] Training Anti-DeepFake & SiW Anti-Spoofing Classifier (Real vs AI/Spoof)")
    print("=" * 85)

    os.makedirs("models", exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[DEVICE] Hardware Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    dataset = CombinedAntiDeepFakeDataset(real_ai_dir, siw_dir)
    if len(dataset) == 0:
        print("[ERROR] No images found!")
        return

    print(f"[DATASET] Loaded COMBINED dataset with {len(dataset)} total images (Real Photos + AI Generated + SiW Spoofs).")

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
                print(f"Batch [{step}/{len(dataloader)}] | Loss: {loss.item():.4f} | Accuracy: {(correct / max(1, total))*100.0:.2f}% | Time: {round(time.time() - start_time, 1)}s")

        epoch_loss = total_loss / max(1, total)
        epoch_acc = (correct / max(1, total)) * 100.0

        print(f"--> Epoch [{epoch:02d}/{epochs:02d}] Finished | Loss: {epoch_loss:.4f} | Anti-DeepFake & Spoof Accuracy: {epoch_acc:.2f}%")
        torch.save(model.state_dict(), save_path)
        print(f"[CHECKPOINT SAVED] Updated Anti-DeepFake weights saved at {save_path}.")

    print(f"[SUCCESS] Anti-DeepFake & SiW Spoof Fine-Tuning Complete in {round(time.time() - start_time, 1)} sec!")

if __name__ == "__main__":
    train_anti_deepfake()
