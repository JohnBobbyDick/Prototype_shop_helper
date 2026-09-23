from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import ScanHistory
from app.schemas.schemas import ScanHistoryResponse, HistoryCreateItem

router = APIRouter()


@router.get("/history", response_model=list[ScanHistoryResponse])
async def get_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ScanHistory).order_by(ScanHistory.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.post("/history", response_model=list[ScanHistoryResponse])
async def create_history(
    items: list[HistoryCreateItem],
    db: AsyncSession = Depends(get_db),
):
    if not items:
        raise HTTPException(status_code=400, detail="No items to save")

    scans: list[ScanHistory] = []
    for item in items:
        scan = ScanHistory(
            category=item.category,
            category_ru=item.category_ru,
            product_detail=item.product_detail,
            confidence=item.confidence,
        )
        db.add(scan)
        scans.append(scan)

    await db.commit()
    for scan in scans:
        await db.refresh(scan)
    return scans


@router.delete("/history")
async def clear_history(db: AsyncSession = Depends(get_db)):
    await db.execute(delete(ScanHistory))
    await db.commit()
    return {"message": "History cleared"}


@router.delete("/history/{scan_id}")
async def delete_scan(scan_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ScanHistory).where(ScanHistory.id == scan_id))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    await db.delete(scan)
    await db.commit()
    return {"message": "Scan deleted"}
