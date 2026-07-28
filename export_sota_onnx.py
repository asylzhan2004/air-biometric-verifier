"""
Exports SOTA Fine-Tuned InceptionResnetV1 Model to ONNX with Dynamic Batch Axis.
Ready for TensorRT FP16 compilation & Triton Inference Server deployment.
"""
import os
import torch
from facenet_pytorch import InceptionResnetV1

def export_sota_onnx(
    pth_path="models/finetuned_kyc_arcface.pth",
    onnx_path="models/face_embedding.onnx"
):
    print("=" * 80)
    print(f"[EXPORT] Exporting Pretrained SOTA InceptionResnetV1 to ONNX...")
    print("=" * 80)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = InceptionResnetV1(pretrained='vggface2').eval().to(device)

    if os.path.exists(pth_path):
        state = torch.load(pth_path, map_location=device, weights_only=False)
        model.load_state_dict(state, strict=False)
        print(f"[LOAD] Loaded fine-tuned weights from {pth_path}")

    dummy_input = torch.randn(1, 3, 160, 160, device=device)

    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["embedding"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "embedding": {0: "batch_size"}
        }
    )

    print(f"[SUCCESS] ONNX Model Exported with Dynamic Batching: {onnx_path}")
    print(f"[TRTEXEC COMMAND FOR TENSORRT FP16]:")
    print(f"trtexec --onnx={onnx_path} --saveEngine=models/face_embedding_fp16.trt --fp16 --minShapes=input:1x3x160x160 --optShapes=input:8x3x160x160 --maxShapes=input:32x3x160x160 --workspace=4096")

if __name__ == "__main__":
    export_sota_onnx()
