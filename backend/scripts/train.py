"""
Fine-tune YOLOv8n for VoiceShop (products + negatives).

Local CPU (slow):
  .venv\\Scripts\\python scripts/prepare_dataset.py
  .venv\\Scripts\\python scripts/train.py

Prefer Google Colab GPU — see scripts/colab_train.ipynb
"""

from __future__ import annotations

import shutil
from pathlib import Path

from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent
DATA_YAML = ROOT / "datasets" / "yolo" / "data.yaml"
BASE_WEIGHTS = ROOT / "yolov8n.pt"
OUT_WEIGHTS = ROOT / "shopsee_yolov8n.pt"


def main() -> None:
    if not DATA_YAML.exists():
        raise SystemExit("Run prepare_dataset.py first")

    weights = str(BASE_WEIGHTS) if BASE_WEIGHTS.exists() else "yolov8n.pt"
    print(f"Base: {weights}")
    print(f"Data: {DATA_YAML}")

    model = YOLO(weights)
    model.train(
        data=str(DATA_YAML),
        epochs=50,
        imgsz=416,
        batch=4,
        device="cpu",
        workers=0,
        project=str(ROOT / "runs"),
        name="voiceshop",
        exist_ok=True,
        patience=15,
        freeze=10,
        lr0=0.004,
        optimizer="AdamW",
        cos_lr=True,
        mosaic=0.1,
        mixup=0.0,
        copy_paste=0.0,
        close_mosaic=15,
        degrees=5,
        translate=0.05,
        scale=0.2,
        fliplr=0.5,
        verbose=True,
    )

    best = ROOT / "runs" / "voiceshop" / "weights" / "best.pt"
    if not best.exists():
        raise SystemExit(f"best.pt not found at {best}")
    shutil.copy2(best, OUT_WEIGHTS)
    print(f"Copied -> {OUT_WEIGHTS}")


if __name__ == "__main__":
    main()
