from fastapi import APIRouter, Depends
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.models import ScanHistory
from app.schemas.schemas import ScanHistoryResponse

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
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Scan not found")
    await db.delete(scan)
    await db.commit()
    return {"message": "Scan deleted"}
