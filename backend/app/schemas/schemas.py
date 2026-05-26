from datetime import datetime
from pydantic import BaseModel, Field


class AnalyzeResponse(BaseModel):
    category: str
    category_ru: str
    product_detail: str | None = None
    confidence: float = Field(ge=0, le=100)

    model_config = {"from_attributes": True}


class ScanHistoryResponse(BaseModel):
    id: int
    category: str
    category_ru: str
    product_detail: str | None = None
    confidence: float
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSettingsResponse(BaseModel):
    id: int
    language: str
    voice_enabled: bool
    voice_speed: float
    high_contrast: bool
    font_size: str

    model_config = {"from_attributes": True}


class UserSettingsUpdate(BaseModel):
    language: str | None = None
    voice_enabled: bool | None = None
    voice_speed: float | None = Field(None, ge=0.5, le=2.0)
    high_contrast: bool | None = None
    font_size: str | None = Field(None, pattern=r"^(normal|large|xlarge)$")
