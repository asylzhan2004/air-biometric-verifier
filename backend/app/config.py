from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    liveness_model_path: str = str(Path("X:/jobexp/onnx файл/minifasnet_v2.onnx"))
    liveness_live_threshold: float = 0.50
    match_threshold: float = 0.68   # cosine distance: lower = more similar

settings = Settings()
