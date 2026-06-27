"""Load Isolation Forest artifact and run anomaly scoring."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from ml.feature_engineering import FEATURE_COLUMNS

logger = logging.getLogger("otarisk.ml.iforest_pred")

MODEL_PATH = Path(__file__).resolve().parent / "artifacts" / "isolation_forest.joblib"

_cached: dict[str, Any] | None = None


def _load() -> dict[str, Any]:
    global _cached
    if _cached is None:
        if not MODEL_PATH.exists():
            from ml.train_isolation_forest import train

            train()
        _cached = joblib.load(MODEL_PATH)
        logger.info("IsolationForest loaded from %s", MODEL_PATH)
    return _cached


def predict(features: pd.Series) -> dict[str, Any]:
    bundle = _load()
    model = bundle["model"]
    df = pd.DataFrame([features.values], columns=FEATURE_COLUMNS)

    raw = float(model.decision_function(df)[0])  # higher = more normal
    pred = int(model.predict(df)[0])  # -1 anomaly, 1 normal
    # Map raw score (typically -0.2..0.3) to a 0..1 anomaly score
    anomaly_score = float(np.clip(1 / (1 + np.exp(8 * raw)), 0.0, 1.0))
    return {
        "anomaly_score": round(anomaly_score, 3),
        "is_anomaly": bool(pred == -1),
        "raw_decision": round(raw, 4),
        "model_version": bundle["meta"]["version"],
    }


def metadata() -> dict[str, Any]:
    return _load()["meta"]
