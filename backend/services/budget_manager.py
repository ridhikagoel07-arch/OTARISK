"""AI Budget Manager (SIMULATED).

Tracks per-process AI spend against a configurable budget. In production this
would be backed by Redis / a metering service. Here it lives in memory and is
seeded from `AI_BUDGET_TOTAL` (default $2.00) so demos are reproducible.
"""
from __future__ import annotations

import logging
import os
import threading

logger = logging.getLogger("otarisk.budget")

BUDGET_TOTAL = float(os.environ.get("AI_BUDGET_TOTAL", "2.00"))

# Per-call costs (USD)
COST_TABLE = {
    "ml_only": 0.000,
    "cheap": 0.002,   # gpt-4o-mini / gemini-3-flash
    "premium": 0.018,  # gpt-4.1 / claude-opus
}

_lock = threading.Lock()
_spent: float = 0.0


def remaining() -> float:
    with _lock:
        return round(max(0.0, BUDGET_TOTAL - _spent), 4)


def total() -> float:
    return BUDGET_TOTAL


def spent() -> float:
    with _lock:
        return round(_spent, 4)


def reset() -> None:
    global _spent
    with _lock:
        _spent = 0.0


def select_tier(fraud_probability: float, anomaly_count: int, llm_required: bool) -> str:
    """Choose ML-only, cheap, or premium LLM tier.

    fraud_probability: 0..100
    """
    if not llm_required:
        return "ml_only"
    if fraud_probability >= 92 or anomaly_count >= 5:
        return "premium"
    return "cheap"


def charge(tier: str) -> float:
    global _spent
    cost = COST_TABLE.get(tier, 0.0)
    with _lock:
        if _spent + cost > BUDGET_TOTAL:
            logger.warning("AI budget exceeded — falling back to ml_only routing.")
            return 0.0
        _spent += cost
    return round(cost, 4)


def cost_of(tier: str) -> float:
    return COST_TABLE.get(tier, 0.0)
