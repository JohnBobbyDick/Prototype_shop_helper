from sqlalchemy import select

from app.core.database import async_session
from app.core.defaults import default_settings_kwargs
from app.models.models import UserSettings


async def seed_default_settings() -> None:
    """Ensure the single settings row exists with repo defaults (first run only)."""
    async with async_session() as session:
        result = await session.execute(select(UserSettings).limit(1))
        if result.scalar_one_or_none() is None:
            session.add(UserSettings(**default_settings_kwargs()))
            await session.commit()
