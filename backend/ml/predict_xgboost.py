"""Load XGBoost artifact and run predictions."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from ml.feature_engineering import FEATURE_COLUMNS

logger = logging.getLogger("otarisk.ml.xgb_pred")

MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "xgboost_model.joblib"

_cached: dict[str, Any] | None = None


def _load() -> dict[str, Any]:
    global _cached
    if _cached is None:
        if not MODEL_PATH.exists():
            from ml.train_xgboost import train

            train()
        _cached = joblib.load(MODEL_PATH)
        logger.info("XGBoost model loaded from %s", MODEL_PATH)
    return _cached


def predict(features: pd.Series) -> dict[str, Any]:
    bundle = _load()
    model = bundle["model"]
    df = pd.DataFrame([features.values], columns=FEATURE_COLUMNS)
    proba = float(model.predict_proba(df)[0][1])
    pct = round(proba * 100, 2)
    # Confidence = absolute distance from 0.5 boundary, normalised to 0..100
    confidence = round(50 + abs(proba - 0.5) * 100, 2)
    importances = dict(zip(FEATURE_COLUMNS, model.feature_importances_.tolist()))
    top = sorted(importances.items(), key=lambda kv: kv[1], reverse=True)[:5]
    return {
        "fraud_probability": pct,
        "confidence": confidence,
        "raw_proba": proba,
        "top_features": [{"name": k, "weight": round(float(v), 3)} for k, v in top],
        "model_version": bundle["meta"]["version"],
    }


def metadata() -> dict[str, Any]:
    return _load()["meta"]
