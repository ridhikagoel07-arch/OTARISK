"""LLM Reasoning Service.

If an OpenAI/Gemini API key is configured we attempt a real call via the
`emergentintegrations` universal client. Otherwise we return a deterministic
mock that mirrors the production response shape so the UI is fully functional
in offline mode.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any

logger = logging.getLogger("otarisk.llm")

CHEAP_MODELS = ["gpt-4o-mini", "gemini-3-flash"]
PREMIUM_MODELS = ["gpt-4.1", "claude-opus-4"]


def _has_real_llm() -> bool:
    return bool(
        os.environ.get("EMERGENT_LLM_KEY")
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
    )


def _model_for(tier: str) -> str:
    return CHEAP_MODELS[0] if tier == "cheap" else PREMIUM_MODELS[0]


def _mock_response(
    *,
    transaction: dict,
    features: dict,
    fraud_probability: float,
    anomaly_score: float,
    tier: str,
    anomalies: list[dict],
) -> dict[str, Any]:
    """Deterministic mock LLM reasoning so the demo works without API keys."""
    model = _model_for(tier)
    risk_factors = [a["label"] for a in anomalies] or ["Behavioural deviation"]
    amount = transaction.get("amount", 0)
    merchant = transaction.get("merchant", "unknown merchant")
    loc = transaction.get("location") or {}
    country = (loc.get("country") if isinstance(loc, dict) else None) or "unknown"

    if fraud_probability >= 80:
        recommendation = "Temporarily Hold"
        summary = (
            f"Transaction of ${amount:,.2f} at {merchant} ({country}) presents a "
            f"high fraud probability ({fraud_probability:.1f}%) with anomaly score "
            f"{anomaly_score:.2f}. Multiple behavioural indicators converge towards "
            "account takeover."
        )
    elif fraud_probability >= 30:
        recommendation = "Approve with OTP"
        summary = (
            f"Transaction at {merchant} shows moderate risk ({fraud_probability:.1f}%). "
            "Customer presence should be re-verified via OTP before release."
        )
    else:
        recommendation = "Approve"
        summary = (
            f"Transaction at {merchant} fits the customer's behavioural baseline "
            f"(probability {fraud_probability:.1f}%). No further action required."
        )

    reasoning = [
        f"XGBoost reports {fraud_probability:.1f}% fraud probability "
        f"(amount_ratio={features.get('amount_ratio', 0):.1f}, "
        f"velocity_24h={int(features.get('velocity_24h', 0))}).",
        f"Isolation Forest anomaly score {anomaly_score:.2f} "
        f"({'strong outlier' if anomaly_score >= 0.7 else 'borderline' if anomaly_score >= 0.4 else 'in-distribution'}).",
        f"Behavioural signals: {', '.join(risk_factors)}.",
        "No prompt-injection patterns observed in analyst input.",
    ]

    return {
        "model": model,
        "summary": summary,
        "risk_factors": risk_factors,
        "recommendation": recommendation,
        "confidence": round(min(99.0, 60 + fraud_probability * 0.4), 1),
        "reasoning": reasoning,
        "is_mock": True,
        "tokens": 980 if tier == "cheap" else 2_120,
        "latency_ms": 412 if tier == "cheap" else 1_842,
    }


def reason(
    *,
    transaction: dict,
    features: dict,
    fraud_probability: float,
    anomaly_score: float,
    anomalies: list[dict],
    tier: str,
    sanitized_prompt: str | None,
) -> dict[str, Any]:
    """Return an LLM reasoning payload for the investigation report."""
    if tier == "ml_only":
        return {
            "model": "none",
            "summary": "LLM not invoked — ML pipeline conclusive.",
            "risk_factors": [],
            "recommendation": "Approve",
            "confidence": round(99.0 - fraud_probability * 0.2, 1),
            "reasoning": ["High XGBoost confidence; LLM call skipped to preserve budget."],
            "is_mock": True,
            "tokens": 0,
            "latency_ms": 0,
        }

    if not _has_real_llm():
        return _mock_response(
            transaction=transaction,
            features=features,
            fraud_probability=fraud_probability,
            anomaly_score=anomaly_score,
            tier=tier,
            anomalies=anomalies,
        )

    # Real LLM path — best-effort. Falls back to mock on any error.
    model = _model_for(tier)
    start = time.perf_counter()
    try:  # pragma: no cover - network path, optional
        from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore

        key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("OPENAI_API_KEY") or ""
        chat = LlmChat(api_key=key, session_id=f"otarisk-{transaction.get('transaction_id', 'x')}",
                       system_message=(
                           "You are an enterprise fraud analyst. Only analyse the provided "
                           "transaction context and respond in JSON with keys: summary, "
                           "risk_factors[], recommendation, confidence, reasoning[]."
                       )).with_model("openai" if "gpt" in model else "gemini", model)
        user_msg = UserMessage(text=(sanitized_prompt or "Investigate fraud risk.")
                               + f"\n\nFeatures: {features}\nAnomalies: {anomalies}")
        reply = await_or_sync(chat.send_message(user_msg))
        latency = int((time.perf_counter() - start) * 1000)
        return {
            "model": model,
            "summary": str(reply)[:600],
            "risk_factors": [a["label"] for a in anomalies],
            "recommendation": "Temporarily Hold" if fraud_probability >= 80 else "Approve with OTP",
            "confidence": round(min(99.0, 60 + fraud_probability * 0.4), 1),
            "reasoning": [str(reply)[:600]],
            "is_mock": False,
            "tokens": 0,
            "latency_ms": latency,
        }
    except Exception as exc:  # pragma: no cover
        logger.warning("LLM call failed (%s); returning mock.", exc)
        return _mock_response(
            transaction=transaction,
            features=features,
            fraud_probability=fraud_probability,
            anomaly_score=anomaly_score,
            tier=tier,
            anomalies=anomalies,
        )


def await_or_sync(value):  # pragma: no cover
    """Helper so this sync function can `await` LlmChat when applicable."""
    import asyncio

    if asyncio.iscoroutine(value):
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return asyncio.run(value)
        return loop.run_until_complete(value)
    return value
