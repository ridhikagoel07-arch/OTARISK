"""Pydantic models shared across API & services."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Inputs
# ---------------------------------------------------------------------------


class Location(BaseModel):
    city: str = "Unknown"
    country: str = "Unknown"
    flag: Optional[str] = None


class TransactionIn(BaseModel):
    """Incoming transaction payload for POST /predict."""

    model_config = ConfigDict(extra="ignore")

    transaction_id: Optional[str] = None
    customer_id: str
    amount: float = Field(gt=0)
    currency: str = "USD"
    merchant: str
    merchant_category: Optional[str] = None
    location: Location
    device_id: Optional[str] = None
    device: Optional[str] = None
    channel: Literal["card_present", "card_not_present", "online", "wallet"] = "online"
    timestamp: Optional[datetime] = None
    user_prompt: Optional[str] = None  # optional analyst question to LLM


# ---------------------------------------------------------------------------
# Domain
# ---------------------------------------------------------------------------


class Customer(BaseModel):
    customer_id: str
    name: str
    home_city: str
    home_country: str
    baseline_avg_amount: float
    baseline_max_amount: float
    known_devices: List[str] = []
    known_merchants: List[str] = []
    account_age_days: int = 365
    risk_tier: Literal["low", "medium", "high"] = "low"


class Transaction(BaseModel):
    transaction_id: str
    customer_id: str
    amount: float
    currency: str = "USD"
    merchant: str
    merchant_category: Optional[str] = None
    city: str
    country: str
    device: Optional[str] = None
    channel: str = "online"
    timestamp: datetime
    is_fraud: Optional[int] = None  # only present in training data


# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------


class Anomaly(BaseModel):
    key: str
    label: str
    detail: str


class PromptInjectionResult(BaseModel):
    security_status: Literal["Protected", "Sanitized", "Blocked", "Standby"]
    threats_neutralized: int
    sanitized_prompt: Optional[str] = None
    original_prompt: Optional[str] = None
    validation_time_ms: int
    security_score: str
    pii_masked: bool


class LLMResult(BaseModel):
    model: str
    summary: str
    risk_factors: List[str]
    recommendation: str
    confidence: float
    reasoning: List[str]
    is_mock: bool = True
    tokens: int = 0
    latency_ms: int = 0


class PredictionResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    confidence: float
    anomaly_score: float
    pipeline: Literal["Pipeline 1", "Pipeline 2", "Pipeline 3"]
    pipeline_code: Literal["A", "B", "C"]
    risk_level: Literal["low", "medium", "critical"]
    selected_models: List[str]
    llm_used: bool
    routing_reason: str
    estimated_cost: float
    remaining_budget: float
    security_status: str
    recommendation: str
    processing_time: str
    processing_time_ms: int
    anomalies: List[Anomaly] = []
    llm: Optional[LLMResult] = None
    prompt_protection: Optional[PromptInjectionResult] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    features: dict[str, Any] = Field(default_factory=dict)


class AuditEntry(BaseModel):
    transaction_id: str
    stage: str
    detail: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


class PipelineCount(BaseModel):
    code: Literal["A", "B", "C"]
    label: str
    count: int
    pct: float


class DashboardResponse(BaseModel):
    total_transactions: int
    fraud_detected: int
    fraud_rate: float
    avg_fraud_probability: float
    avg_latency_ms: int
    total_ai_cost: float
    ai_budget_remaining: float
    ai_budget_total: float
    money_saved: float
    pipeline_distribution: List[PipelineCount]
    llm_invocations: int
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
