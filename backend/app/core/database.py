from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with async_session() as session:
        yield session


def _ensure_columns(sync_conn) -> None:
    """Add columns introduced after first install (SQLite has no auto-migrate)."""
    from sqlalchemy import inspect, text

    inspector = inspect(sync_conn)
    if "user_settings" not in inspector.get_table_names():
        return
    cols = {c["name"] for c in inspector.get_columns("user_settings")}
    if "voice_mode" not in cols:
        sync_conn.execute(
            text(
                "ALTER TABLE user_settings "
                "ADD COLUMN voice_mode VARCHAR(20) DEFAULT 'product' NOT NULL"
            )
        )


async def init_db() -> None:
    import app.models.models  # noqa: F401 — register tables on Base.metadata
    from app.core.seed import seed_default_settings

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_columns)

    await seed_default_settings()
