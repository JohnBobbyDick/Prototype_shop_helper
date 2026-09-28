"""
Build clean YOLO dataset for VoiceShop.

- Products from datasets/raw/all/{apple,banana,milk_bottle}
  auto-labeled by COCO YOLOv8n (strict: no full-frame boxes)
- Negatives from datasets/raw/negative (empty label files)

Usage (from backend/):
  .venv\\Scripts\\python scripts/prepare_dataset.py
"""

from __future__ import annotations

import random
import shutil
from pathlib import Path

from PIL import Image
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "datasets" / "raw"
RAW_ALL = RAW / "all"
RAW_NEG = RAW / "negative"
OUT = ROOT / "datasets" / "yolo"
BASE_WEIGHTS = ROOT / "yolov8n.pt"

CLASS_MAP = {
    "apple": (0, {47}, 0.32),
    "banana": (1, {46}, 0.32),
    "milk_bottle": (2, {39, 41}, 0.12),
}

NAME_BY_ID = {0: "apple", 1: "banana", 2: "milk"}
VAL_RATIO = 0.15
SEED = 42
MAX_BOX_AREA = 0.55


def iter_images(folder: Path):
    if not folder.exists():
        return
    for p in sorted(folder.iterdir()):
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
            yield p


def yolo_line(cls_id: int, xyxy: list[float], w: int, h: int) -> str | None:
    x1, y1, x2, y2 = xyxy
    bw = (x2 - x1) / w
    bh = (y2 - y1) / h
    area = bw * bh
    if area > MAX_BOX_AREA or area < 0.01:
        return None
    if bw < 0.04 or bh < 0.04:
        return None
    cx = min(max(((x1 + x2) / 2) / w, 0.0), 1.0)
    cy = min(max(((y1 + y2) / 2) / h, 0.0), 1.0)
    bw = min(max(bw, 1e-3), 1.0)
    bh = min(max(bh, 1e-3), 1.0)
    return f"{cls_id} {cx:.6f} {cy:.6f} {bw:.6f} {bh:.6f}"


def auto_label(
    model: YOLO,
    src: Path,
    our_id: int,
    coco_ids: set[int],
    min_conf: float,
    w: int,
    h: int,
) -> list[str]:
    results = model.predict(
        source=str(src),
        conf=min_conf,
        iou=0.5,
        classes=list(coco_ids),
        verbose=False,
    )
    boxes = results[0].boxes
    if boxes is None or len(boxes) == 0:
        return []
    lines: list[str] = []
    for box in sorted(boxes, key=lambda b: float(b.conf[0]), reverse=True)[:3]:
        line = yolo_line(our_id, box.xyxy[0].tolist(), w, h)
        if line:
            lines.append(line)
    return lines


def write_data_yaml() -> None:
    # Relative path so the zip works on Colab / any machine
    (OUT / "data.yaml").write_text(
        """# VoiceShop dataset (products + negatives)
path: .
train: images/train
val: images/val

names:
  0: apple
  1: banana
  2: milk_bottle
""",
        encoding="utf-8",
    )


def dump(split: str, items: list[tuple[Path, int | None, list[str]]]) -> None:
    img_out = OUT / "images" / split
    lbl_out = OUT / "labels" / split
    img_out.mkdir(parents=True, exist_ok=True)
    lbl_out.mkdir(parents=True, exist_ok=True)
    for i, (src, our_id, lines) in enumerate(items):
        prefix = "neg" if our_id is None else NAME_BY_ID[our_id]
        stem = f"{prefix}_{i:04d}_{src.stem}"
        stem = "".join(c if c.isalnum() or c in "-_" else "_" for c in stem)
        dst = img_out / f"{stem}{src.suffix.lower()}"
        shutil.copy2(src, dst)
        (lbl_out / f"{stem}.txt").write_text(
            ("\n".join(lines) + "\n") if lines else "",
            encoding="utf-8",
        )


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)

    weights = str(BASE_WEIGHTS) if BASE_WEIGHTS.exists() else "yolov8n.pt"
    print(f"Auto-label model: {weights}")
    model = YOLO(weights)

    positives: list[tuple[Path, int, list[str]]] = []
    skipped = 0
    for folder, (our_id, coco_ids, min_conf) in CLASS_MAP.items():
        for src in iter_images(RAW_ALL / folder):
            with Image.open(src) as im:
                w, h = im.size
            lines = auto_label(model, src, our_id, coco_ids, min_conf, w, h)
            if not lines:
                skipped += 1
                continue
            positives.append((src, our_id, lines))

    negatives: list[tuple[Path, None, list[str]]] = []
    for src in iter_images(RAW_NEG):
        negatives.append((src, None, []))

    print(f"Positives labeled={len(positives)}, skipped={skipped}")
    print(f"Negatives={len(negatives)}")

    rng = random.Random(SEED)

    by_cls: dict[int, list] = {0: [], 1: [], 2: []}
    for item in positives:
        by_cls[item[1]].append(item)

    train: list = []
    val: list = []
    for cls_id, items in by_cls.items():
        rng.shuffle(items)
        n_val = max(1, int(round(len(items) * VAL_RATIO)))
        val.extend(items[:n_val])
        train.extend(items[n_val:])
        print(f"  class {cls_id}: train={len(items) - n_val} val={n_val}")

    rng.shuffle(negatives)
    n_neg_val = max(1, int(round(len(negatives) * VAL_RATIO))) if negatives else 0
    val.extend(negatives[:n_neg_val])
    train.extend(negatives[n_neg_val:])
    print(f"  negatives: train={len(negatives) - n_neg_val} val={n_neg_val}")

    rng.shuffle(train)
    rng.shuffle(val)
    dump("train", train)
    dump("val", val)
    write_data_yaml()
    print(f"Done. train={len(train)} val={len(val)}")
    print(f"-> {OUT / 'data.yaml'}")


if __name__ == "__main__":
    main()
