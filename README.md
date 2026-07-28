# ✈️ Air Biometric Verifier — SOTA Face Recognition & e-Gate Verification System

![Version](https://img.shields.io/badge/version-14.0.0--SOTA-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-green.svg)
![React](https://img.shields.io/badge/React-18-cyan.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-teal.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.2-orange.svg)
![Accuracy](https://img.shields.io/badge/Anti--DeepFake%20Accuracy-96.48%25-brightgreen.svg)

**Air Biometric Verifier** is an enterprise-grade AI biometric face recognition and verification system designed for **airport border e-Gates, KYC document verification, and high-security access control**.

---

## 🌟 Key Features

- **🏆 ArcFace Open-Set Embedding Model ($s=64.0, m=0.50$)**: High-margin 512D hyperspherical vector representation trained on multi-source passport & selfie datasets.
- **🛡️ SOTA Anti-DeepFake Protection (96.48% Accuracy)**: ResNet18 binary classifier detecting AI-generated synthetic visuals (Midjourney, Stable Diffusion, DeepFake swaps).
- **🏛️ Real-Time Interactive eGov 3D Liveness**: 3-step head turn liveness flow (Left $\to$ Right $\to$ Center) with real-time head yaw ratio tracking.
- **🔴🟡🟢 3-Zone Quality & FAR Security Protection Architecture**:
  - **Zone 1 ($q < 0.30$)**: `Quality Floor Enforcer` (Auto-rejects severely blurred or dark frames).
  - **Zone 2 ($0.30 \le q < 0.65$)**: `FAR Protection` (Enforces strict `0.38` threshold for intermediate quality).
  - **Zone 3 ($q \ge 0.65$)**: `High Quality` (Base threshold `0.35`).
- **👁️ Yaw-Adaptive Periocular Weighting**: Dynamic shift from $60\%$ to $85\%$ weight onto upper periocular region (eyes/eyebrows/nose bridge) during head yaw turns.
- **📄 High-Res PDF & Photo Passport Processing**: Scale=4 PDF rendering with CLAHE adaptive histogram equalization & unsharp masking.
- **⚡ Microsecond Pipeline Profiling & LRU Document Cache**: Repeat document embeddings cached at **0.00 ms** (`fromCache: true`). Live turnstile latency ~**22.5 ms**.
- **🚀 Triton Inference Server & TensorRT FP16 Ready**: Pre-configured `config.pbtxt` with dynamic batching ($4, 8, 16, 32$) and GPU instance groups.

---

## 🏗️ Architecture & Pipeline

```
DOCUMENT (PDF / Photo)  ──► PyPDFium2 Render (Scale 4) ──┐
                                                          ├─► MTCNN 5-Point Alignment ──► 512D ArcFace Embedding
CAMERA / WEBCAM FRAME   ──► Real-Time Yaw Tracking   ────┘
                                                                        │
                                                                        ▼
                                                         Anti-DeepFake Classifier (96.48%)
                                                                        │
                                                                        ▼
                                                         Periocular Upper-Face Fusion (0.60 -> 0.85)
                                                                        │
                                                                        ▼
                                                         3-Zone Quality & Security Decision Engine
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.10+ with CUDA support
- Node.js 18+ and npm

### 2. Backend Installation & Run
```bash
# Clone the repository
git clone https://github.com/<your-username>/air-biometric-verifier.git
cd air-biometric-verifier

# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Launch FastAPI backend on port 8000
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

### 3. Frontend Installation & Run
```bash
# Install frontend dependencies
npm install

# Launch Vite dev server on port 3000
npm run dev
```

Open **http://localhost:3000** in your browser!

---

## 📊 Performance Telemetry & API Endpoints

- `GET /health` — Service status & active security pipeline parameters.
- `POST /api/v1/biometrics/verify` — Single document 1-to-1 verification with 3-zone quality audit.
- `POST /api/v1/biometrics/search` — Multi-document 1-to-N search returning ArgMax best match.
- `POST /api/v1/biometrics/detect-yaw` — Real-time head yaw angle & pose estimator (`LEFT`, `RIGHT`, `CENTER`).
- `POST /api/v1/biometrics/egov-verify` — eGov 3D interactive head-turn liveness verification.

---

## 📜 License
MIT License. Created for enterprise biometric security solutions.
