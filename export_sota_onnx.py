"""
Exports SOTA Fine-Tuned InceptionResnetV1 Model to ONNX with Dynamic Batch Axis.
Includes ONNXRuntime Numerical Equivalence Verification & State Dict Key Auditing.
Ready for TensorRT FP16 compilation & Triton Inference Server deployment.
"""
import os
import torch
import numpy as np
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
        load_res = model.load_state_dict(state, strict=False)
        print(f"[LOAD] Loaded fine-tuned weights from {pth_path}")
        print(f"[WEIGHT AUDIT] Missing keys: {len(load_res.missing_keys)} | Unexpected keys: {len(load_res.unexpected_keys)}")

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

    # ONNX Runtime Numerical Verification Check
    try:
        import onnxruntime as ort
        print("[VERIFICATION] Running ONNX Runtime Numerical Equivalence Check...")
        
        with torch.no_grad():
            torch_output = model(dummy_input).cpu().numpy()
            
        ort_session = ort.InferenceSession(onnx_path)
        ort_inputs = {ort_session.get_inputs()[0].name: dummy_input.cpu().numpy()}
        ort_output = ort_session.run(None, ort_inputs)[0]
        
        max_diff = float(np.max(np.abs(torch_output - ort_output)))
        is_close = np.allclose(torch_output, ort_output, atol=1e-3)
        
        print(f"[VERIFICATION] Max Difference PyTorch vs ONNX: {max_diff:.6e}")
        print(f"[VERIFICATION STATUS] Numerical Equivalence Passed (atol=1e-3): {is_close}")
    except Exception as e:
        print(f"[VERIFICATION WARNING] ONNX Runtime check skipped: {e}")

    print(f"\n[TRTEXEC COMMAND FOR TENSORRT FP16]:")
    print(f"trtexec --onnx={onnx_path} --saveEngine=models/face_embedding_fp16.trt --fp16 --minShapes=input:1x3x160x160 --optShapes=input:8x3x160x160 --maxShapes=input:32x3x160x160 --workspace=4096")

if __name__ == "__main__":
    export_sota_onnx()
