import asyncio

from fastapi import APIRouter, Request, UploadFile, File, HTTPException

router = APIRouter()


@router.post("/detect")
async def detect_products(request: Request, file: UploadFile = File(...)):
    detector = getattr(request.app.state, "detector", None)
    if detector is None:
        raise HTTPException(503, "Detection model not loaded yet")

    image_bytes = await file.read()
    if len(image_bytes) < 100:
        raise HTTPException(400, "Image too small")

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, detector.detect, image_bytes)
    return result
