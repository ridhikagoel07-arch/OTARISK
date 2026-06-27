from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Logging
from utils.logger import configure_logging  # noqa: E402

configure_logging()
logger = logging.getLogger("otarisk")

# Routers / services
from api.routes import api_router  # noqa: E402
from utils.db import close_db, init_db  # noqa: E402
from utils.seed import seed_if_empty  # noqa: E402
from ml.bootstrap import ensure_models_trained  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting OtaRisk backend ...")
    await init_db()
    await seed_if_empty()
    ensure_models_trained()
    logger.info("OtaRisk backend ready.")
    yield
    await close_db()
    logger.info("OtaRisk backend shutdown complete.")


app = FastAPI(
    title="OtaRisk Fraud Investigation API",
    description=(
        "Enterprise-grade AI fraud investigation backend. "
        "Combines real XGBoost + Isolation Forest predictions with a simulated "
        "Otari pipeline router, AI budget manager, prompt-injection protection and "
        "LLM reasoning layer."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "service": "OtaRisk Fraud Investigation API",
        "status": "ok",
        "docs": "/docs",
        "api_prefix": "/api",
    }
