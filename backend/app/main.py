import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.routes import analyze, history, settings as settings_routes, detect

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    await init_db()

    try:
        from app.services.detector import ProductDetector

        print("[VoiceShop] Loading YOLO detection model...")
        app.state.detector = ProductDetector()
        print("[VoiceShop] Detection model READY")
    except Exception:
        import traceback

        traceback.print_exc()
        print("[VoiceShop] ERROR: Could not load detection model")
        app.state.detector = None

    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api", tags=["analyze"])
app.include_router(history.router, prefix="/api", tags=["history"])
app.include_router(settings_routes.router, prefix="/api", tags=["settings"])
app.include_router(detect.router, prefix="/api", tags=["detect"])


@app.get("/api/health")
async def health():
    detector_ready = getattr(app.state, "detector", None) is not None
    return {"status": "ok", "detector_ready": detector_ready}
