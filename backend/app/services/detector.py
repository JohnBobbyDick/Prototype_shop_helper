import io
import logging
import time
from pathlib import Path

from PIL import Image

logger = logging.getLogger(__name__)

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_CUSTOM_MODEL = _BACKEND_DIR / "shopsee_yolov8n.pt"
_BASE_MODEL = _BACKEND_DIR / "yolov8n.pt"

PRODUCT_CLASSES_CUSTOM = {
    0: {
        "product": "Apple",
        "product_ru": "Яблоко",
        "category": "Fruits & Vegetables",
        "category_ru": "Фрукты и овощи",
        "color": "#f87171",
    },
    1: {
        "product": "Banana",
        "product_ru": "Банан",
        "category": "Fruits & Vegetables",
        "category_ru": "Фрукты и овощи",
        "color": "#4ade80",
    },
    2: {
        "product": "Milk",
        "product_ru": "Молоко",
        "category": "Dairy Products",
        "category_ru": "Молочная продукция",
        "color": "#60a5fa",
    },
}

PRODUCT_CLASSES_COCO = {
    47: PRODUCT_CLASSES_CUSTOM[0],
    46: PRODUCT_CLASSES_CUSTOM[1],
    39: PRODUCT_CLASSES_CUSTOM[2],
}

# Geometry / confidence heuristics (no retrain)
MIN_CONF_CUSTOM = 0.62
MIN_CONF_COCO = 0.30
MAX_BOX_AREA = 0.42  # face/selfie often fills most of the frame
MIN_BOX_AREA = 0.015
PERSON_IOU_DROP = 0.28  # drop product box if overlaps a person this much


def _box_area(bbox: list[float]) -> float:
    return max(0.0, bbox[2] - bbox[0]) * max(0.0, bbox[3] - bbox[1])


def _aspect(bbox: list[float]) -> float:
    w = max(bbox[2] - bbox[0], 1e-6)
    h = max(bbox[3] - bbox[1], 1e-6)
    return w / h


def _iou(a: list[float], b: list[float]) -> float:
    x1 = max(a[0], b[0])
    y1 = max(a[1], b[1])
    x2 = min(a[2], b[2])
    y2 = min(a[3], b[3])
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    if inter <= 0:
        return 0.0
    union = _box_area(a) + _box_area(b) - inter
    return inter / union if union > 0 else 0.0


def _passes_shape(product: str, bbox: list[float], conf_pct: float) -> bool:
    area = _box_area(bbox)
    if area > MAX_BOX_AREA or area < MIN_BOX_AREA:
        return False

    ar = _aspect(bbox)

    # Large near-square blobs in selfie view are usually a head, not fruit
    if 0.7 <= ar <= 1.4 and area > 0.22 and conf_pct < 85:
        return False

    if product == "Banana":
        # Bananas are elongated; reject "fat" boxes unless very confident
        elongated = ar >= 1.5 or ar <= 0.67
        if not elongated and conf_pct < 78:
            return False
    elif product == "Apple":
        if ar > 2.0 or ar < 0.5:
            return False
    elif product == "Milk":
        # Bottle is taller than wide
        if ar > 1.15 and conf_pct < 80:
            return False

    return True


class ProductDetector:
    def __init__(self):
        from ultralytics import YOLO

        self.person_model = None

        if _CUSTOM_MODEL.exists():
            model_ref = str(_CUSTOM_MODEL)
            self.class_map = PRODUCT_CLASSES_CUSTOM
            self.custom = True
            logger.info("Loading fine-tuned ShopSee model from %s...", model_ref)
            # Base COCO model only for person veto (cuts head→banana FPs)
            base_ref = str(_BASE_MODEL) if _BASE_MODEL.exists() else "yolov8n.pt"
            try:
                self.person_model = YOLO(base_ref)
                logger.info("Person-veto model loaded from %s", base_ref)
            except Exception:
                logger.exception("Could not load person-veto model")
                self.person_model = None
        else:
            model_ref = str(_BASE_MODEL) if _BASE_MODEL.exists() else "yolov8n.pt"
            self.class_map = PRODUCT_CLASSES_COCO
            self.custom = False
            logger.info(
                "Fine-tuned model not found, loading base YOLOv8n from %s...",
                model_ref,
            )

        t0 = time.time()
        self.model = YOLO(model_ref)
        logger.info("Model loaded in %.1fs (custom=%s)", time.time() - t0, self.custom)

    def _person_boxes(self, image: Image.Image) -> list[list[float]]:
        if self.person_model is None:
            return []
        results = self.person_model(
            image,
            conf=0.45,
            iou=0.45,
            classes=[0],  # COCO person
            verbose=False,
            max_det=5,
        )
        boxes = []
        for box in results[0].boxes or []:
            boxes.append(box.xyxyn[0].tolist())
        return boxes

    def detect(self, image_bytes: bytes) -> dict:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        t0 = time.time()
        kwargs = {
            "conf": MIN_CONF_CUSTOM if self.custom else MIN_CONF_COCO,
            "iou": 0.45,
            "verbose": False,
            "max_det": 8,
        }
        if not self.custom:
            kwargs["classes"] = list(self.class_map.keys())

        results = self.model(image, **kwargs)

        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            if cls_id not in self.class_map:
                continue

            info = self.class_map[cls_id]
            bbox = [round(x, 4) for x in box.xyxyn[0].tolist()]
            conf_pct = round(float(box.conf[0]) * 100, 1)

            if not _passes_shape(info["product"], bbox, conf_pct):
                continue

            detections.append(
                {
                    "bbox": bbox,
                    "confidence": conf_pct,
                    **info,
                }
            )

        # If a "product" sits on a person — drop it (typical head false positive)
        if detections and self.person_model is not None:
            persons = self._person_boxes(image)
            if persons:
                detections = [
                    d
                    for d in detections
                    if not any(_iou(d["bbox"], p) >= PERSON_IOU_DROP for p in persons)
                    or d["confidence"] >= 90
                ]

        inference_ms = round((time.time() - t0) * 1000)
        return {"detections": detections, "inference_ms": inference_ms}
