"""Bootstrap helper — ensures both ML artifacts exist on app startup.

The training data is synthetic and tiny so training takes ~1-2 seconds. We
train on first boot if artifacts are missing.
"""
from __future__ import annotations

import logging
from pathlib import Path

logger = logging.getLogger("otarisk.ml.bootstrap")

ART = Path(__file__).resolve().parent / "artifacts"


def ensure_models_trained() -> None:
    xgb_path = ART / "xgboost_model.joblib"
    iforest_path = ART / "isolation_forest.joblib"

    if not xgb_path.exists():
        logger.info("XGBoost artifact missing — training now ...")
        from ml.train_xgboost import train

        train()
    if not iforest_path.exists():
        logger.info("IsolationForest artifact missing — training now ...")
        from ml.train_isolation_forest import train

        train()

    # Warm load
    from ml.predict_isolation_forest import _load as _load_if
    from ml.predict_xgboost import _load as _load_xgb

    _load_xgb()
    _load_if()
    logger.info("ML artifacts ready.")
