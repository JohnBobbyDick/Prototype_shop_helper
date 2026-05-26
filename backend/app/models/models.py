from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    category_ru: Mapped[str] = mapped_column(String(100), nullable=False)
    product_detail: Mapped[str | None] = mapped_column(String(200), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    image_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    language: Mapped[str] = mapped_column(String(5), default="ru", nullable=False)
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    voice_speed: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    font_size: Mapped[str] = mapped_column(
        String(20), default="large", nullable=False
    )
