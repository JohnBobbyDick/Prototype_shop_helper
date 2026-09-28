"""
VoiceShop detector: fine-tuned weights if present, else COCO yolov8n.
"""

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


class ProductDetector:
    def __init__(self):
        from ultralytics import YOLO

        if _CUSTOM_MODEL.exists():
            model_ref = str(_CUSTOM_MODEL)
            self.class_map = PRODUCT_CLASSES_CUSTOM
            self.custom = True
            logger.info("Loading fine-tuned model %s", model_ref)
        else:
            model_ref = str(_BASE_MODEL) if _BASE_MODEL.exists() else "yolov8n.pt"
            self.class_map = PRODUCT_CLASSES_COCO
            self.custom = False
            logger.info("Loading base COCO model %s", model_ref)

        t0 = time.time()
        self.model = YOLO(model_ref)
        logger.info("Ready in %.1fs (custom=%s)", time.time() - t0, self.custom)

    def detect(self, image_bytes: bytes) -> dict:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        t0 = time.time()
        kwargs = {
            "conf": 0.40 if self.custom else 0.22,
            "iou": 0.45,
            "verbose": False,
            "max_det": 10,
        }
        if not self.custom:
            kwargs["classes"] = list(self.class_map.keys())

        results = self.model(image, **kwargs)
        inference_ms = round((time.time() - t0) * 1000)

        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            if cls_id not in self.class_map:
                continue
            info = self.class_map[cls_id]
            x1, y1, x2, y2 = box.xyxyn[0].tolist()
            detections.append(
                {
                    "bbox": [round(x1, 4), round(y1, 4), round(x2, 4), round(y2, 4)],
                    "confidence": round(float(box.conf[0]) * 100, 1),
                    **info,
                }
            )

        return {"detections": detections, "inference_ms": inference_ms}
