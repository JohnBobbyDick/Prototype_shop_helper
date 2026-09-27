"""
Build YOLO detection labels from folder-classified product photos.

Uses ALL images under datasets/raw/all, auto-labels with COCO YOLOv8n.
Images that cannot be auto-labeled are SKIPPED (no full-frame boxes —
those caused person→banana false positives).

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
RAW_ALL = ROOT / "datasets" / "raw" / "all"
OUT = ROOT / "datasets" / "yolo"
BASE_WEIGHTS = ROOT / "yolov8n.pt"

# folder -> (our_id, coco_ids to accept for auto-label)
CLASS_MAP = {
    "apple": (0, {47}, 0.28),  # apple
    "banana": (1, {46}, 0.28),  # banana
    "milk_bottle": (2, {39, 41}, 0.15),  # bottle, cup
}

VAL_RATIO = 0.18
SEED = 42
MIN_AUTO_CONF = 0.28
# reject near-full-frame boxes (they teach "whole camera = class")
MAX_BOX_AREA = 0.85


def iter_images(folder: Path):
    for p in sorted(folder.iterdir()):
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
            yield p


def yolo_line(cls_id: int, xyxy: list[float], w: int, h: int) -> str | None:
    x1, y1, x2, y2 = xyxy
    bw = (x2 - x1) / w
    bh = (y2 - y1) / h
    if bw * bh > MAX_BOX_AREA:
        return None
    if bw < 0.05 or bh < 0.05:
        return None
    cx = ((x1 + x2) / 2) / w
    cy = ((y1 + y2) / 2) / h
    cx = min(max(cx, 0.0), 1.0)
    cy = min(max(cy, 0.0), 1.0)
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
    lines: list[str] = []
    if boxes is None or len(boxes) == 0:
        return lines

    scored = sorted(boxes, key=lambda b: float(b.conf[0]), reverse=True)
    for box in scored[:3]:
        line = yolo_line(our_id, box.xyxy[0].tolist(), w, h)
        if line:
            lines.append(line)
    return lines


def write_data_yaml() -> None:
    yaml = f"""# ShopSee fine-tune dataset (clean auto-labels only)
path: {OUT.as_posix()}
train: images/train
val: images/val

names:
  0: apple
  1: banana
  2: milk_bottle
"""
    (OUT / "data.yaml").write_text(yaml, encoding="utf-8")


def main() -> None:
    if not RAW_ALL.exists():
        raise SystemExit(f"Missing {RAW_ALL}. Extract data.rar into datasets/raw first.")

    if OUT.exists():
        shutil.rmtree(OUT)

    weights = str(BASE_WEIGHTS) if BASE_WEIGHTS.exists() else "yolov8n.pt"
    print(f"Loading auto-label model: {weights}")
    model = YOLO(weights)

    labeled: list[tuple[Path, int, list[str]]] = []
    skipped = 0

    for folder_name, (our_id, coco_ids, min_conf) in CLASS_MAP.items():
        src_dir = RAW_ALL / folder_name
        if not src_dir.exists():
            print(f"WARN: missing {src_dir}")
            continue
        for src in iter_images(src_dir):
            with Image.open(src) as im:
                w, h = im.size
            lines = auto_label(model, src, our_id, coco_ids, min_conf, w, h)
            if not lines:
                skipped += 1
                continue
            labeled.append((src, our_id, lines))

    random.Random(SEED).shuffle(labeled)

    # stratified-ish split by class
    by_cls: dict[int, list] = {0: [], 1: [], 2: []}
    for item in labeled:
        by_cls[item[1]].append(item)

    train_items: list = []
    val_items: list = []
    for cls_id, items in by_cls.items():
        n_val = max(1, int(round(len(items) * VAL_RATIO)))
        val_items.extend(items[:n_val])
        train_items.extend(items[n_val:])
        print(f"class {cls_id}: train={len(items) - n_val}, val={n_val}")

    name_by_id = {0: "apple", 1: "banana", 2: "milk"}

    def dump(split: str, items: list) -> None:
        img_out = OUT / "images" / split
        lbl_out = OUT / "labels" / split
        img_out.mkdir(parents=True, exist_ok=True)
        lbl_out.mkdir(parents=True, exist_ok=True)
        for i, (src, our_id, lines) in enumerate(items):
            stem = f"{name_by_id[our_id]}_{i:04d}_{src.stem}"
            dst_img = img_out / f"{stem}{src.suffix.lower()}"
            shutil.copy2(src, dst_img)
            (lbl_out / f"{stem}.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")

    dump("train", train_items)
    dump("val", val_items)
    write_data_yaml()

    print(f"Labeled={len(labeled)}, skipped(no box)={skipped}")
    print(f"train={len(train_items)}, val={len(val_items)}")
    print(f"data.yaml -> {OUT / 'data.yaml'}")


if __name__ == "__main__":
    main()
