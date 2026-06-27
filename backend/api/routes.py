"""OtaRisk REST API.

All routes are mounted under `/api` so the Kubernetes ingress can route them
to this service. The investigation flow lives in `predict_transaction()` which
orchestrates feature engineering -> XGBoost -> Isolation Forest -> Otari ->
prompt sanitization -> LLM -> budget -> audit -> persistence.
"""
from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from ml.feature_engineering import build_features, derive_anomalies
from ml.predict_isolation_forest import predict as if_predict
from ml.predict_xgboost import predict as xgb_predict
from models.schemas import (
    DashboardResponse,
    PipelineCount,
    PredictionResponse,
    TransactionIn,
)
from services import audit_service, budget_manager
from services.llm_service import reason as llm_reason
from services.otari_router import select_pipeline
from services.prompt_injection import sanitize
from utils.db import get_db

logger = logging.getLogger("otarisk.api")

api_router = APIRouter(prefix="/api")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _fetch_customer(customer_id: str) -> dict:
    db = get_db()
    cust = await db.customers.find_one({"customer_id": customer_id}, {"_id": 0})
    if cust:
        return cust
    # Fallback default profile so unknown customers still work end-to-end.
    return {
        "customer_id": customer_id,
        "name": "Unknown Customer",
        "home_city": "Unknown",
        "home_country": "Unknown",
        "baseline_avg_amount": 150.0,
        "baseline_max_amount": 2000.0,
        "known_devices": [],
        "known_merchants": [],
        "account_age_days": 365,
        "risk_tier": "low",
    }


async def _recent_history(customer_id: str, limit: int = 60) -> list[dict]:
    db = get_db()
    cur = (
        db.transactions.find({"customer_id": customer_id}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )
    return await cur.to_list(limit)


def _new_transaction_id() -> str:
    return "TX-" + uuid.uuid4().hex[:10].upper()


# ---------------------------------------------------------------------------
# /predict — the main investigation orchestrator
# ---------------------------------------------------------------------------


@api_router.post("/predict", response_model=PredictionResponse)
async def predict_transaction(payload: TransactionIn) -> PredictionResponse:
    started = time.perf_counter()
    db = get_db()
    txn_id = payload.transaction_id or _new_transaction_id()

    # 1. Customer + recent history
    customer = await _fetch_customer(payload.customer_id)
    history = await _recent_history(payload.customer_id)

    # 2. Feature engineering
    raw = payload.model_dump()
    raw["transaction_id"] = txn_id
    raw["timestamp"] = (payload.timestamp or datetime.now(timezone.utc)).isoformat()
    features = build_features(raw, customer, history)
    anomalies = derive_anomalies(features, payload.merchant)
    audit_entries: list[dict] = [
        {"stage": "transaction_received", "detail": f"Customer={payload.customer_id} amount={payload.amount}"},
        {"stage": "feature_engineering", "detail": f"{len(features)} features computed, {len(anomalies)} anomalies."},
    ]

    # 3. XGBoost
    xgb = xgb_predict(features)
    audit_entries.append(
        {"stage": "xgboost_prediction", "detail": f"prob={xgb['fraud_probability']}% conf={xgb['confidence']}%"}
    )

    # 4. Isolation Forest (always computed — needed for Pipeline B/C decisions)
    iforest = if_predict(features)
    audit_entries.append(
        {"stage": "isolation_forest", "detail": f"score={iforest['anomaly_score']} anomaly={iforest['is_anomaly']}"}
    )

    # 5. Otari Router
    routing = select_pipeline(
        fraud_probability=xgb["fraud_probability"],
        anomaly_score=iforest["anomaly_score"],
        anomaly_count=len(anomalies),
    )
    audit_entries.append({"stage": "otari_router", "detail": f"pipeline={routing.pipeline_code}: {routing.routing_reason}"})

    # 6. Budget tier + Prompt Injection + LLM
    tier = budget_manager.select_tier(
        xgb["fraud_probability"], len(anomalies), llm_required=routing.needs_llm
    )
    security = sanitize(payload.user_prompt if routing.needs_llm else None)
    llm_payload = None
    if routing.needs_llm:
        llm_payload = llm_reason(
            transaction=raw,
            features=features.to_dict(),
            fraud_probability=xgb["fraud_probability"],
            anomaly_score=iforest["anomaly_score"],
            anomalies=anomalies,
            tier=tier,
            sanitized_prompt=security["sanitized_prompt"],
        )
        audit_entries.append(
            {"stage": "llm_reasoning", "detail": f"{llm_payload['model']} tier={tier} mock={llm_payload['is_mock']}"}
        )

    cost = budget_manager.charge(tier)
    selected_models = list(routing.selected_models)
    if routing.needs_llm and llm_payload:
        selected_models.append(llm_payload["model"])

    # 7. Recommendation (LLM overrides router if higher-confidence is available)
    recommendation = (llm_payload or {}).get("recommendation") or routing.recommendation

    processing_ms = int((time.perf_counter() - started) * 1000)
    audit_entries.append({"stage": "decision", "detail": f"{recommendation} in {processing_ms}ms"})

    response = PredictionResponse(
        transaction_id=txn_id,
        fraud_probability=round(xgb["fraud_probability"], 2),
        confidence=round(xgb["confidence"], 2),
        anomaly_score=round(iforest["anomaly_score"], 3),
        pipeline=routing.pipeline_label,
        pipeline_code=routing.pipeline_code,
        risk_level=routing.risk_level,
        selected_models=selected_models,
        llm_used=routing.needs_llm,
        routing_reason=routing.routing_reason,
        estimated_cost=cost,
        remaining_budget=budget_manager.remaining(),
        security_status=security["security_status"],
        recommendation=recommendation,
        processing_time=f"{processing_ms} ms",
        processing_time_ms=processing_ms,
        anomalies=anomalies,
        llm=llm_payload,
        prompt_protection=security,
        features={k: float(v) for k, v in features.to_dict().items()},
    )

    # 8. Persist transaction + prediction + audit
    tx_doc = {
        **raw,
        "city": (raw.get("location") or {}).get("city"),
        "country": (raw.get("location") or {}).get("country"),
        "is_fraud": None,
    }
    tx_doc.pop("location", None)
    tx_doc.pop("user_prompt", None)
    await db.transactions.update_one(
        {"transaction_id": txn_id}, {"$set": tx_doc}, upsert=True
    )
    await db.predictions.update_one(
        {"transaction_id": txn_id},
        {"$set": response.model_dump(mode="json")},
        upsert=True,
    )
    await audit_service.append(txn_id, audit_entries)

    return response


# ---------------------------------------------------------------------------
# /transactions
# ---------------------------------------------------------------------------


@api_router.get("/transactions")
async def list_transactions(
    limit: int = Query(default=100, ge=1, le=500),
    customer_id: Optional[str] = None,
    risk_level: Optional[str] = None,
) -> list[dict]:
    db = get_db()
    q: dict = {}
    if customer_id:
        q["customer_id"] = customer_id
    cur = db.transactions.find(q, {"_id": 0}).sort("timestamp", -1).limit(limit)
    txns = await cur.to_list(limit)
    if risk_level:
        # Join with the prediction collection to filter by risk level.
        ids = [t["transaction_id"] for t in txns]
        preds = await db.predictions.find(
            {"transaction_id": {"$in": ids}, "risk_level": risk_level}, {"_id": 0}
        ).to_list(limit)
        pred_ids = {p["transaction_id"] for p in preds}
        txns = [t for t in txns if t["transaction_id"] in pred_ids]
    return txns


@api_router.get("/transactions/{transaction_id}")
async def get_transaction(transaction_id: str) -> dict:
    db = get_db()
    tx = await db.transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


# ---------------------------------------------------------------------------
# /analysis/{id}
# ---------------------------------------------------------------------------


@api_router.get("/analysis/{transaction_id}")
async def get_analysis(transaction_id: str) -> dict:
    db = get_db()
    pred = await db.predictions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    if not pred:
        raise HTTPException(status_code=404, detail="No prediction recorded for this transaction")
    tx = await db.transactions.find_one({"transaction_id": transaction_id}, {"_id": 0})
    audit = await audit_service.for_transaction(transaction_id)
    return {"transaction": tx, "prediction": pred, "audit": audit}


# ---------------------------------------------------------------------------
# /audit
# ---------------------------------------------------------------------------


@api_router.get("/audit")
async def get_audit(
    transaction_id: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
) -> list[dict]:
    if transaction_id:
        return await audit_service.for_transaction(transaction_id)
    return await audit_service.recent(limit)


# ---------------------------------------------------------------------------
# /dashboard
# ---------------------------------------------------------------------------


@api_router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard() -> DashboardResponse:
    db = get_db()
    total = await db.transactions.count_documents({})
    preds_cursor = db.predictions.find({}, {"_id": 0})
    preds = await preds_cursor.to_list(5000)

    fraud_detected = sum(1 for p in preds if p["pipeline_code"] == "C")
    fraud_rate = round(fraud_detected / total * 100, 2) if total else 0.0
    avg_prob = round(sum(p["fraud_probability"] for p in preds) / len(preds), 2) if preds else 0.0
    avg_latency = int(sum(p["processing_time_ms"] for p in preds) / len(preds)) if preds else 0
    llm_invocations = sum(1 for p in preds if p["llm_used"])
    total_cost = round(sum(p["estimated_cost"] for p in preds), 4)
    money_saved = round(sum(p["fraud_probability"] / 100 * 1200 for p in preds if p["pipeline_code"] == "C"), 2)

    buckets = {"A": 0, "B": 0, "C": 0}
    for p in preds:
        buckets[p["pipeline_code"]] = buckets.get(p["pipeline_code"], 0) + 1
    distribution = [
        PipelineCount(
            code=code,
            label={"A": "Pipeline 1 · Low", "B": "Pipeline 2 · Medium", "C": "Pipeline 3 · Critical"}[code],
            count=cnt,
            pct=round((cnt / len(preds) * 100) if preds else 0.0, 2),
        )
        for code, cnt in buckets.items()
    ]

    return DashboardResponse(
        total_transactions=total,
        fraud_detected=fraud_detected,
        fraud_rate=fraud_rate,
        avg_fraud_probability=avg_prob,
        avg_latency_ms=avg_latency,
        total_ai_cost=total_cost,
        ai_budget_remaining=budget_manager.remaining(),
        ai_budget_total=budget_manager.total(),
        money_saved=money_saved,
        pipeline_distribution=distribution,
        llm_invocations=llm_invocations,
    )


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@api_router.get("/health")
async def health() -> dict:
    from ml.predict_isolation_forest import metadata as if_meta
    from ml.predict_xgboost import metadata as xgb_meta

    return {
        "status": "ok",
        "models": {
            "xgboost": xgb_meta(),
            "isolation_forest": if_meta(),
        },
        "budget": {
            "total": budget_manager.total(),
            "remaining": budget_manager.remaining(),
            "spent": budget_manager.spent(),
        },
    }


# Generic error wrapper for cleaner client experience
@api_router.get("/_ping")
async def ping() -> JSONResponse:
    return JSONResponse({"pong": True, "timestamp": datetime.now(timezone.utc).isoformat()})
