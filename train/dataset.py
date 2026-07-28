"""
Multi-Source Dataset Loader:
Parses identity folders from:
- AgeDB Dataset (archive (18))
- MIDV-500 Documents Dataset (midv500-master)
- Portrait & 30 Photos Dataset (archive (14))
- 105 Classes Pins Dataset (archive (16))
- KYC Datasets (archive (5), archive (6), archive (8), archive, archive (7))
"""
import os
import PIL.Image
import torch
from torch.utils.data import Dataset
from torchvision import transforms

class MultiSourceFaceDataset(Dataset):
    def __init__(self, root_dirs, transform=None, augment=True):
        self.image_paths = []
        self.labels = []
        self.class_to_idx = {}
        self.idx_to_class = {}

        if transform is None:
            if augment:
                self.transform = transforms.Compose([
                    transforms.Resize((160, 160)),
                    transforms.RandomHorizontalFlip(p=0.5),
                    transforms.ColorJitter(brightness=0.15, contrast=0.15),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
                ])
            else:
                self.transform = transforms.Compose([
                    transforms.Resize((160, 160)),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
                ])
        else:
            self.transform = transform

        for root_dir in root_dirs:
            if not os.path.exists(root_dir):
                continue

            # Special case for AgeDB (filenames: id_Name_age_gender.jpg)
            if "archive (18)" in root_dir or "agedb" in root_dir.lower():
                agedb_path = os.path.join(root_dir, "AgeDB") if os.path.exists(os.path.join(root_dir, "AgeDB")) else root_dir
                for fname in os.listdir(agedb_path):
                    if fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                        parts = fname.split('_')
                        if len(parts) >= 2:
                            identity_name = parts[1]
                            if identity_name not in self.class_to_idx:
                                idx = len(self.class_to_idx)
                                self.class_to_idx[identity_name] = idx
                                self.idx_to_class[idx] = identity_name
                            
                            self.image_paths.append(os.path.join(agedb_path, fname))
                            self.labels.append(self.class_to_idx[identity_name])
                continue

            # Standard subfolder parsing
            for dp, dn, filenames in os.walk(root_dir):
                for f in filenames:
                    if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                        rel_dir = os.path.relpath(dp, root_dir)
                        if rel_dir == '.':
                            continue
                        
                        folder_name = rel_dir.replace('\\', '_').replace('/', '_')
                        if folder_name not in self.class_to_idx:
                            idx = len(self.class_to_idx)
                            self.class_to_idx[folder_name] = idx
                            self.idx_to_class[idx] = folder_name
                        
                        self.image_paths.append(os.path.join(dp, f))
                        self.labels.append(self.class_to_idx[folder_name])

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
            # Fallback tensor if image reading fails
            return torch.zeros((3, 160, 160)), label
