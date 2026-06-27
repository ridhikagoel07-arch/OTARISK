"""Mozilla Otari Router (SIMULATED).

Maps an XGBoost fraud probability to one of three pipelines and produces a
human-readable explanation. This module is intentionally simple so a real
routing service can replace it via the same `select_pipeline()` contract.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class RoutingDecision:
    pipeline_code: Literal["A", "B", "C"]
    pipeline_label: str  # "Pipeline 1"|"Pipeline 2"|"Pipeline 3"
    risk_level: Literal["low", "medium", "critical"]
    needs_isolation_forest: bool
    needs_llm: bool
    needs_human_review: bool
    recommendation: str
    routing_reason: str
    selected_models: list[str]


def select_pipeline(fraud_probability: float, anomaly_score: float, anomaly_count: int) -> RoutingDecision:
    """fraud_probability is a 0..100 percentage."""
    if fraud_probability < 30:
        return RoutingDecision(
            pipeline_code="A",
            pipeline_label="Pipeline 1",
            risk_level="low",
            needs_isolation_forest=False,
            needs_llm=False,
            needs_human_review=False,
            recommendation="Approve",
            routing_reason=(
                f"Fraud probability {fraud_probability:.1f}% below 30% threshold. "
                "Automated approval — no further investigation required."
            ),
            selected_models=["XGBoost"],
        )

    if fraud_probability < 80:
        reason = (
            f"Fraud probability {fraud_probability:.1f}% in 30–80% band; "
            f"isolation-forest anomaly score {anomaly_score:.2f} confirms uncertainty. "
            "Step-up authentication via OTP recommended."
        )
        return RoutingDecision(
            pipeline_code="B",
            pipeline_label="Pipeline 2",
            risk_level="medium",
            needs_isolation_forest=True,
            needs_llm=False,
            needs_human_review=False,
            recommendation="Approve with OTP",
            routing_reason=reason,
            selected_models=["XGBoost", "Isolation Forest"],
        )

    reason = (
        f"Fraud probability {fraud_probability:.1f}% above 80% threshold with "
        f"{anomaly_count} behavioural anomalies and IsolationForest score "
        f"{anomaly_score:.2f}. Routing to LLM reasoning + human review."
    )
    return RoutingDecision(
        pipeline_code="C",
        pipeline_label="Pipeline 3",
        risk_level="critical",
        needs_isolation_forest=True,
        needs_llm=True,
        needs_human_review=True,
        recommendation="Temporarily Hold",
        routing_reason=reason,
        selected_models=["XGBoost", "Isolation Forest"],
    )
