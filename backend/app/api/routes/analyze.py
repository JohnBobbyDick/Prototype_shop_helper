import asyncio

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import ScanHistory
from app.schemas.schemas import AnalyzeResponse

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Detect products on the frame and save the best match to history."""
    detector = getattr(request.app.state, "detector", None)
    if detector is None:
        raise HTTPException(503, "Detection model not loaded yet")

    image_bytes = await file.read()
    if len(image_bytes) < 100:
        raise HTTPException(400, "Image too small")

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, detector.detect, image_bytes)
    detections = result.get("detections") or []

    if not detections:
        raise HTTPException(404, "No products detected")

    best = max(detections, key=lambda d: d["confidence"])

    scan = ScanHistory(
        category=best["category"],
        category_ru=best["category_ru"],
        product_detail=best["product_ru"],
        confidence=best["confidence"],
    )
    db.add(scan)
    await db.commit()

    return AnalyzeResponse(
        category=best["category"],
        category_ru=best["category_ru"],
        product_detail=best["product_ru"],
        confidence=best["confidence"],
    )
