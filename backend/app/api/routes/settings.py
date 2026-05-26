from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.defaults import default_settings_kwargs
from app.models.models import UserSettings
from app.schemas.schemas import UserSettingsResponse, UserSettingsUpdate

router = APIRouter()


async def _get_or_create_settings(db: AsyncSession) -> UserSettings:
    result = await db.execute(select(UserSettings).limit(1))
    settings = result.scalar_one_or_none()
    if not settings:
        settings = UserSettings(**default_settings_kwargs())
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings


@router.get("/settings", response_model=UserSettingsResponse)
async def get_settings(db: AsyncSession = Depends(get_db)):
    return await _get_or_create_settings(db)


@router.put("/settings", response_model=UserSettingsResponse)
async def update_settings(
    data: UserSettingsUpdate,
    db: AsyncSession = Depends(get_db),
):
    settings = await _get_or_create_settings(db)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    await db.commit()
    await db.refresh(settings)
    return settings
