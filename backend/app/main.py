import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.demo import router as demo_router
from app.issuance import router as issuance_router
from app.verification import router as verification_router


def load_env_file() -> None:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


load_env_file()
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    ).split(",")
    if origin.strip()
]

app = FastAPI(
    title="PRAMANIK-DRISHTI API",
    description="Real-Time Forgery Detection and Intelligent Underwriting Insights for Canara Bank SuRaksha Hackathon",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event() -> None:
    init_db()


app.include_router(issuance_router)
app.include_router(verification_router)
app.include_router(demo_router)


@app.get("/")
def root() -> dict:
    return {
        "name": "PRAMANIK-DRISHTI",
        "tagline": "Authentic Vision — The document that sees its own truth",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }
