"""
Anti-DeepFake & AI-Generated Visuals Classifier Training Script:
Trains a Binary Classifier (Real Photo vs AI / DeepFake Generated Image)
using dataset in archive (20) / my_real_vs_ai_dataset.
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

# Enable UTF-8 encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

class RealVsAIDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.image_paths = []
        self.labels = [] # 0: Real, 1: AI / DeepFake

        if transform is None:
            self.transform = transforms.Compose([
                transforms.Resize((160, 160)),
                transforms.RandomHorizontalFlip(),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
        else:
            self.transform = transform

        real_dir = os.path.join(root_dir, "real")
        ai_dir = os.path.join(root_dir, "ai_images")

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
    dataset_dir=r"X:\работа с обучением\archive (20)\my_real_vs_ai_dataset\my_real_vs_ai_dataset",
    epochs=5,
    batch_size=64,
    lr=0.0001,
    save_path="models/anti_deepfake_classifier.pth"
):
    print("=" * 85)
    print("[START] Training Anti-DeepFake & AI-Generated Visuals Classifier (Real vs AI)")
    print("=" * 85)

    os.makedirs("models", exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[DEVICE] Hardware Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    dataset = RealVsAIDataset(dataset_dir)
    if len(dataset) == 0:
        print("[ERROR] No Real vs AI dataset images found!")
        return

    print(f"[DATASET] Loaded {len(dataset)} images (Real Photos + AI Generated Visuals).")

    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=True
    )

    # Use pretrained MobileNetV3 / ResNet18 for ultra-fast Anti-DeepFake classification
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    model.fc = nn.Linear(model.fc.in_features, 2)
    model = model.to(device)

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

            if step % 50 == 0:
                print(f"Batch [{step}/{len(dataloader)}] | Loss: {loss.item():.4f}")

        epoch_loss = total_loss / max(1, total)
        epoch_acc = (correct / max(1, total)) * 100.0

        print(f"--> Epoch [{epoch:02d}/{epochs:02d}] Finished | Loss: {epoch_loss:.4f} | Anti-DeepFake Accuracy: {epoch_acc:.2f}%")
        torch.save(model.state_dict(), save_path)
        print(f"[CHECKPOINT SAVED] Anti-DeepFake weights saved at {save_path}.")

    print(f"[SUCCESS] Anti-DeepFake Training Complete in {round(time.time() - start_time, 1)} sec!")

if __name__ == "__main__":
    train_anti_deepfake()
