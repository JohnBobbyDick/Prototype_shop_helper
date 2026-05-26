from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "ShopSee API"
    DEBUG: bool = True
    DATABASE_URL: str = f"sqlite+aiosqlite:///{Path(__file__).resolve().parent.parent.parent / 'shopsee.db'}"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ]
    # Разрешить фронт с телефона в той же Wi‑Fi сети (http://192.168.x.x:3000)
    CORS_ORIGIN_REGEX: str = r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$"
    UPLOAD_DIR: str = str(Path(__file__).resolve().parent.parent.parent / "uploads")

    model_config = {"extra": "ignore"}


settings = Settings()
