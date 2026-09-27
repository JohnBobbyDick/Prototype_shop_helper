"""
Fine-tune YOLOv8n on clean ShopSee labels (no full-frame junk boxes).

Usage (from backend/):
  .venv\\Scripts\\python scripts/prepare_dataset.py
  .venv\\Scripts\\python scripts/train.py
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
        raise SystemExit(
            f"Missing {DATA_YAML}. Run: python scripts/prepare_dataset.py"
        )

    weights = str(BASE_WEIGHTS) if BASE_WEIGHTS.exists() else "yolov8n.pt"
    print(f"Base weights: {weights}")
    print(f"Dataset: {DATA_YAML}")

    model = YOLO(weights)
    results = model.train(
        data=str(DATA_YAML),
        epochs=60,
        imgsz=416,
        batch=4,
        device="cpu",
        workers=0,
        project=str(ROOT / "runs"),
        name="shopsee_v2",
        exist_ok=True,
        patience=18,
        # keep COCO features that separate person vs fruit
        freeze=10,
        lr0=0.005,
        lrf=0.01,
        optimizer="AdamW",
        cos_lr=True,
        # milder aug — less "whole frame is object" nonsense
        mosaic=0.15,
        mixup=0.0,
        copy_paste=0.0,
        close_mosaic=20,
        degrees=5,
        translate=0.05,
        scale=0.2,
        fliplr=0.5,
        hsv_h=0.01,
        hsv_s=0.4,
        hsv_v=0.3,
        box=7.5,
        cls=1.0,
        verbose=True,
    )

    best = ROOT / "runs" / "shopsee_v2" / "weights" / "best.pt"
    if not best.exists():
        best = ROOT / "runs" / "detect" / "shopsee_v2" / "weights" / "best.pt"
    if not best.exists():
        raise SystemExit(f"best.pt not found under {ROOT / 'runs'}")

    shutil.copy2(best, OUT_WEIGHTS)
    print(f"Copied best weights -> {OUT_WEIGHTS}")
    print(results)


if __name__ == "__main__":
    main()
