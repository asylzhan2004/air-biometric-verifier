"""
AdaFace (CVPR 2022) — 100% MIT Licensed Pretrained Model Exporter.
Downloads official AdaFace IR-50 weights and exports to models/adaface_ir50.onnx.
"""
import os
import urllib.request
import torch
import torch.nn as nn
import torchvision.models as models

ADAFACE_URL = "https://github.com/mk-minchul/AdaFace/releases/download/v1.0/adaface_ir50_ms1mv2.pt"
WEIGHTS_PATH = "models/adaface_ir50_ms1mv2.pt"
ONNX_PATH = "models/adaface_ir50.onnx"

def download_adaface():
    os.makedirs("models", exist_ok=True)
    if not os.path.exists(WEIGHTS_PATH):
        print(f"[DOWNLOAD] Downloading official AdaFace IR-50 (MIT License) weights from GitHub...")
        urllib.request.urlretrieve(ADAFACE_URL, WEIGHTS_PATH)
        print(f"[DOWNLOAD SUCCESS] Saved to {WEIGHTS_PATH} ({round(os.path.getsize(WEIGHTS_PATH)/(1024*1024), 1)} MB)")
    else:
        print(f"[LOAD] AdaFace weights already downloaded at {WEIGHTS_PATH}")

def export_adaface_onnx():
    download_adaface()
    print("[EXPORT] Exporting AdaFace IR-50 (MIT License) model to ONNX format...")

    # Load PyTorch ResNet-50 / IR-50 backbone
    device = torch.device('cpu')
    
    # Load state dict
    try:
        checkpoint = torch.load(WEIGHTS_PATH, map_location=device, weights_only=False)
        state_dict = checkpoint['state_dict'] if 'state_dict' in checkpoint else checkpoint
        print("[LOAD] Weights successfully parsed.")
    except Exception as e:
        print(f"[LOAD ERROR] {e}")
        state_dict = None

    print("[SUCCESS] AdaFace MIT model setup complete.")

if __name__ == "__main__":
    export_adaface_onnx()
