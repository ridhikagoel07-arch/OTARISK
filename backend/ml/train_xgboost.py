"""Train an XGBoost binary classifier on the synthetic dataset.

Usage:
    python -m ml.train_xgboost
"""
from __future__ import annotations

import logging
from pathlib import Path

import joblib
import xgboost as xgb
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from ml.dataset import get_or_generate
from ml.feature_engineering import FEATURE_COLUMNS

logger = logging.getLogger("otarisk.ml.xgb")

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "xgboost_model.joblib"


def train() -> dict:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    df = get_or_generate()
    X = df[FEATURE_COLUMNS]
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = xgb.XGBClassifier(
        n_estimators=180,
        max_depth=5,
        learning_rate=0.12,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_lambda=1.2,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=2,
        tree_method="hist",
    )
    model.fit(X_train, y_train)

    y_prob = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_prob)
    accuracy = float((model.predict(X_test) == y_test).mean())

    metadata = {
        "model": "xgboost",
        "version": "otari-xgb-v4.2.1",
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "auc": float(auc),
        "accuracy": accuracy,
        "features": FEATURE_COLUMNS,
    }
    joblib.dump({"model": model, "meta": metadata}, MODEL_PATH)
    logger.info("XGBoost trained → AUC=%.3f acc=%.3f saved=%s", auc, accuracy, MODEL_PATH)
    return metadata


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    meta = train()
    print(meta)
