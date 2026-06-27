"""Train an Isolation Forest anomaly detector on legitimate-only data.

Usage:
    python -m ml.train_isolation_forest
"""
from __future__ import annotations

import logging
from pathlib import Path

import joblib
from sklearn.ensemble import IsolationForest

from ml.dataset import get_or_generate
from ml.feature_engineering import FEATURE_COLUMNS

logger = logging.getLogger("otarisk.ml.iforest")

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "isolation_forest.joblib"


def train() -> dict:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    df = get_or_generate()
    # Train only on legitimate transactions — anomaly detection is unsupervised
    X = df[df["is_fraud"] == 0][FEATURE_COLUMNS]

    model = IsolationForest(
        n_estimators=220,
        contamination=0.06,
        max_samples="auto",
        random_state=42,
        n_jobs=2,
    )
    model.fit(X)

    metadata = {
        "model": "isolation_forest",
        "version": "iforest-ensemble-v2.1",
        "n_train": int(len(X)),
        "contamination": 0.06,
        "features": FEATURE_COLUMNS,
    }
    joblib.dump({"model": model, "meta": metadata}, MODEL_PATH)
    logger.info("IsolationForest trained → n=%d saved=%s", len(X), MODEL_PATH)
    return metadata


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print(train())
