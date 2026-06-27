"""Supervisor entry point. Re-exports the FastAPI app from main.py so that
both `uvicorn main:app` (per OtaRisk README) and `uvicorn server:app`
(supervisor) work."""
from main import app  # noqa: F401
