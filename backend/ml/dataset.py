"""Synthetic training-data generator.

Produces a Pandas DataFrame with 12 engineered features + binary `is_fraud`
label. Deterministic via a fixed numpy seed.

Also persists a CSV at data/transactions.csv so the user can inspect it.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from ml.feature_engineering import FEATURE_COLUMNS

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
CSV_PATH = DATA_DIR / "transactions.csv"

RNG = np.random.default_rng(42)


def _row(is_fraud: int) -> dict:
    if is_fraud:
        # Fraudulent profile: high amount, new device, mismatch, velocity, etc.
        amount = float(RNG.gamma(2.5, 1800))  # heavy tail
        amount_ratio = float(np.clip(RNG.normal(18, 8), 2, 80))
        amount_zscore = float(np.clip(RNG.normal(3.4, 1.0), 0.5, 8))
        merchant_freq = float(np.clip(RNG.normal(0.03, 0.02), 0, 0.2))
        is_new_merchant = int(RNG.random() < 0.65)
        is_new_device = int(RNG.random() < 0.7)
        location_mismatch = int(RNG.random() < 0.6)
        velocity_24h = int(np.clip(RNG.normal(4, 1.5), 0, 9))
        is_night_txn = int(RNG.random() < 0.55)
        merchant_risk = float(RNG.random() < 0.45)
        amount_log = float(np.log1p(amount))
        account_age_days = float(np.clip(RNG.normal(420, 250), 30, 3000))
    else:
        # Legit profile
        amount = float(np.clip(RNG.normal(120, 110), 5, 4000))
        amount_ratio = float(np.clip(RNG.normal(1.0, 0.6), 0.05, 4.5))
        amount_zscore = float(np.clip(RNG.normal(0.1, 0.4), -1.0, 1.6))
        merchant_freq = float(np.clip(RNG.normal(0.18, 0.12), 0, 1.0))
        is_new_merchant = int(RNG.random() < 0.18)
        is_new_device = int(RNG.random() < 0.06)
        location_mismatch = int(RNG.random() < 0.05)
        velocity_24h = int(np.clip(RNG.normal(1.2, 0.9), 0, 6))
        is_night_txn = int(RNG.random() < 0.12)
        merchant_risk = float(RNG.random() < 0.04)
        amount_log = float(np.log1p(amount))
        account_age_days = float(np.clip(RNG.normal(1500, 700), 60, 4000))

    return {
        "amount": amount,
        "amount_ratio": amount_ratio,
        "amount_zscore": amount_zscore,
        "merchant_freq": merchant_freq,
        "is_new_merchant": float(is_new_merchant),
        "is_new_device": float(is_new_device),
        "location_mismatch": float(location_mismatch),
        "velocity_24h": float(velocity_24h),
        "is_night_txn": float(is_night_txn),
        "merchant_risk": merchant_risk,
        "amount_log": amount_log,
        "account_age_days": account_age_days,
        "is_fraud": is_fraud,
    }


def generate(n_total: int = 6000, fraud_rate: float = 0.18) -> pd.DataFrame:
    rows = []
    n_fraud = int(n_total * fraud_rate)
    for _ in range(n_fraud):
        rows.append(_row(1))
    for _ in range(n_total - n_fraud):
        rows.append(_row(0))
    df = pd.DataFrame(rows, columns=FEATURE_COLUMNS + ["is_fraud"])
    # Shuffle deterministically
    return df.sample(frac=1, random_state=42).reset_index(drop=True)


def get_or_generate() -> pd.DataFrame:
    """Generate dataset and persist a copy at data/transactions.csv if missing."""
    df = generate()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not CSV_PATH.exists():
        df.head(500).to_csv(CSV_PATH, index=False)
    return df


if __name__ == "__main__":
    df = get_or_generate()
    print(df.describe())
    print(f"Wrote sample CSV → {CSV_PATH}")
