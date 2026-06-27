"""Feature engineering for fraud detection.

Takes a raw transaction + customer profile + recent customer history and
produces the numeric feature vector consumed by both XGBoost and
Isolation Forest.

All math runs on a single Pandas Series for an individual transaction and on
a DataFrame for batch (training) use.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable, Optional

import numpy as np
import pandas as pd

# The 12 features that both models consume, in fixed order.
FEATURE_COLUMNS: list[str] = [
    "amount",
    "amount_ratio",
    "amount_zscore",
    "merchant_freq",
    "is_new_merchant",
    "is_new_device",
    "location_mismatch",
    "velocity_24h",
    "is_night_txn",
    "merchant_risk",
    "amount_log",
    "account_age_days",
]

HIGH_RISK_MERCHANTS = {
    "Bet365",
    "DraftKings",
    "Crypto.com",
    "Binance",
    "Coinbase",
    "OnlyFans",
    "Western Union",
    "MoneyGram",
    "PayPal Transfer",
    "Wise Transfer",
}


def _parse_ts(ts: Any) -> datetime:
    if ts is None:
        return datetime.now(timezone.utc)
    if isinstance(ts, datetime):
        return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
    return pd.to_datetime(ts, utc=True).to_pydatetime()


def build_features(
    transaction: dict,
    customer: dict,
    recent_history: Optional[Iterable[dict]] = None,
) -> pd.Series:
    """Return a single Pandas Series of features for one transaction."""
    history = list(recent_history or [])

    amount = float(transaction["amount"])
    baseline_avg = float(customer.get("baseline_avg_amount", 100.0) or 100.0)
    baseline_max = float(customer.get("baseline_max_amount", 1000.0) or 1000.0)

    # amount features
    amount_ratio = amount / max(baseline_avg, 1.0)
    amount_zscore = (amount - baseline_avg) / max(baseline_max - baseline_avg, 1.0)
    amount_log = float(np.log1p(amount))

    # merchant frequency in recent history
    merchant = transaction.get("merchant", "")
    known_merchants = set(customer.get("known_merchants", []) or [])
    hist_merchants = [t.get("merchant") for t in history]
    merchant_freq = hist_merchants.count(merchant) / max(len(history), 1) if history else 0.0
    is_new_merchant = int(merchant not in known_merchants and merchant not in hist_merchants)

    # device
    device = transaction.get("device") or transaction.get("device_id") or ""
    known_devices = set(customer.get("known_devices", []) or [])
    hist_devices = {t.get("device") for t in history if t.get("device")}
    is_new_device = int(bool(device) and device not in known_devices and device not in hist_devices)

    # location
    loc = transaction.get("location") or {}
    tx_country = (loc.get("country") if isinstance(loc, dict) else None) or transaction.get(
        "country", ""
    )
    location_mismatch = int(
        tx_country and customer.get("home_country") and tx_country != customer["home_country"]
    )

    # velocity = txns in last 24h
    now = _parse_ts(transaction.get("timestamp"))
    cutoff = now.timestamp() - 24 * 3600
    velocity_24h = sum(
        1 for t in history if _parse_ts(t.get("timestamp")).timestamp() >= cutoff
    )

    # time of day
    hour = now.hour
    is_night_txn = int(hour < 6 or hour >= 23)

    merchant_risk = 1.0 if merchant in HIGH_RISK_MERCHANTS else 0.0

    account_age_days = float(customer.get("account_age_days", 365))

    values = {
        "amount": amount,
        "amount_ratio": float(amount_ratio),
        "amount_zscore": float(amount_zscore),
        "merchant_freq": float(merchant_freq),
        "is_new_merchant": float(is_new_merchant),
        "is_new_device": float(is_new_device),
        "location_mismatch": float(location_mismatch),
        "velocity_24h": float(velocity_24h),
        "is_night_txn": float(is_night_txn),
        "merchant_risk": merchant_risk,
        "amount_log": amount_log,
        "account_age_days": account_age_days,
    }
    return pd.Series(values, index=FEATURE_COLUMNS)


def derive_anomalies(features: pd.Series, merchant: str) -> list[dict]:
    """Human-readable anomaly cards derived directly from the feature vector."""
    anomalies: list[dict] = []
    if features["amount_ratio"] >= 5:
        ratio = int(features["amount_ratio"])
        anomalies.append(
            {
                "key": "amount_spike",
                "label": f"Amount {ratio}× Average",
                "detail": "Statistically extreme spend versus customer baseline.",
            }
        )
    if features["is_new_device"]:
        anomalies.append(
            {"key": "new_device", "label": "New Device", "detail": "First seen on this device."}
        )
    if features["location_mismatch"]:
        anomalies.append(
            {
                "key": "foreign_loc",
                "label": "Foreign Location",
                "detail": "Country deviates from customer home country.",
            }
        )
    if features["is_night_txn"]:
        anomalies.append(
            {
                "key": "unusual_time",
                "label": "Unusual Time",
                "detail": "Activity outside customer's typical hours.",
            }
        )
    if features["velocity_24h"] >= 4:
        anomalies.append(
            {
                "key": "velocity",
                "label": "Velocity Breach",
                "detail": f"{int(features['velocity_24h'])} transactions in last 24h.",
            }
        )
    if features["merchant_risk"]:
        anomalies.append(
            {
                "key": "risk_merchant",
                "label": "High Risk Merchant",
                "detail": f"{merchant} is on the high-risk merchant watchlist.",
            }
        )
    if features["is_new_merchant"] and not features["merchant_risk"]:
        anomalies.append(
            {
                "key": "new_merchant",
                "label": "New Merchant",
                "detail": "Customer has not transacted with this merchant before.",
            }
        )
    return anomalies
