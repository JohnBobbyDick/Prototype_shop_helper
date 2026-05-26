from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import ScanHistory
from app.schemas.schemas import AnalyzeResponse
from app.services.mock_ai import analyze_image

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    image_bytes = await file.read()
    result = await analyze_image(image_bytes)

    scan = ScanHistory(
        category=result["category"],
        category_ru=result["category_ru"],
        product_detail=result["product_detail"],
        confidence=result["confidence"],
    )
    db.add(scan)
    await db.commit()

    return AnalyzeResponse(**result)
