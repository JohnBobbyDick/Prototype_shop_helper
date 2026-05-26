import io
import logging
import time
from pathlib import Path

from PIL import Image

logger = logging.getLogger(__name__)

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_MODEL_PATH = _BACKEND_DIR / "yolov8n.pt"

PRODUCT_CLASSES = {
    46: {
        "product": "Banana",
        "product_ru": "Банан",
        "category": "Fruits & Vegetables",
        "category_ru": "Фрукты и овощи",
        "color": "#4ade80",
    },
    47: {
        "product": "Apple",
        "product_ru": "Яблоко",
        "category": "Fruits & Vegetables",
        "category_ru": "Фрукты и овощи",
        "color": "#f87171",
    },
    39: {
        "product": "Milk",
        "product_ru": "Молоко",
        "category": "Dairy Products",
        "category_ru": "Молочная продукция",
        "color": "#60a5fa",
    },
}


class ProductDetector:
    def __init__(self):
        from ultralytics import YOLO

        model_ref = str(_MODEL_PATH) if _MODEL_PATH.exists() else "yolov8n.pt"
        logger.info("Loading YOLOv8n model from %s...", model_ref)
        t0 = time.time()
        self.model = YOLO(model_ref)
        logger.info("YOLOv8n loaded in %.1fs", time.time() - t0)

    def detect(self, image_bytes: bytes) -> dict:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        t0 = time.time()
        results = self.model(
            image,
            conf=0.22,
            iou=0.45,
            classes=list(PRODUCT_CLASSES.keys()),
            verbose=False,
        )
        inference_ms = round((time.time() - t0) * 1000)

        detections = []
        for box in results[0].boxes:
            cls_id = int(box.cls[0])
            if cls_id not in PRODUCT_CLASSES:
                continue

            info = PRODUCT_CLASSES[cls_id]
            x1, y1, x2, y2 = box.xyxyn[0].tolist()

            detections.append(
                {
                    "bbox": [round(x1, 4), round(y1, 4), round(x2, 4), round(y2, 4)],
                    "confidence": round(float(box.conf[0]) * 100, 1),
                    **info,
                }
            )

        return {"detections": detections, "inference_ms": inference_ms}
