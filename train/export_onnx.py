"""
Export Trained PyTorch Custom ArcFace Model to ONNX format.
Outputs models/custom_arcface_model.onnx ready for ONNXRuntime in FastAPI backend.
"""
import os
import torch
from model import CustomArcFaceNet

def export_to_onnx(pth_path="models/custom_arcface.pth", onnx_path="models/custom_arcface_model.onnx"):
    print("=" * 60)
    print("[EXPORT] Exporting Custom ArcFace model to ONNX format...")
    print("=" * 60)

    device = torch.device("cpu")
    model = CustomArcFaceNet(embedding_size=512).to(device)

    if os.path.exists(pth_path):
        model.load_state_dict(torch.load(pth_path, map_location=device))
        print(f"[LOAD] Weights loaded from {pth_path}")
    else:
        print("[DEMO] No custom .pth file found, exporting initialized architecture...")

    model.eval()

    # Dummy input tensor [batch_size=1, channels=3, height=112, width=112]
    dummy_input = torch.randn(1, 3, 112, 112, device=device)

    os.makedirs(os.path.dirname(onnx_path), exist_ok=True)

    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input_image'],
        output_names=['embedding_512d'],
        dynamic_axes={
            'input_image': {0: 'batch_size'},
            'embedding_512d': {0: 'batch_size'}
        }
    )

    print(f"[SUCCESS] ONNX model exported to: {onnx_path}")
    print("[INFO] Model is ready for ONNXRuntime deployment in FastAPI backend!")

if __name__ == "__main__":
    export_to_onnx()
