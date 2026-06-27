# OtaRisk — Fraud Investigation Backend

Enterprise-grade FastAPI backend powering the OtaRisk AI fraud platform.

It combines **real** XGBoost + Isolation Forest models with a **simulated**
Otari pipeline router, AI budget manager, prompt-injection sanitizer and LLM
reasoning service so the full investigation flow can be demoed end-to-end
without external dependencies.

```
Incoming Transaction
        ↓
Fetch Customer History (MongoDB)
        ↓
Feature Engineering              (real · pandas)
        ↓
XGBoost Fraud Prediction         (real · xgboost)
        ↓
Isolation Forest Anomaly Score   (real · scikit-learn)
        ↓
Otari Router                     (simulated)
        ↓
ML Only / OTP / LLM + Human      (budget-aware routing)
        ↓
Return JSON Response
```

## Architecture

```
backend/
├── main.py                       # FastAPI app + lifespan (DB, seed, ML bootstrap)
├── server.py                     # re-exports `app` for supervisor
├── api/
│   └── routes.py                 # /predict, /dashboard, /transactions, /analysis, /audit
├── services/
│   ├── otari_router.py           # simulated pipeline selection
│   ├── budget_manager.py         # in-process AI budget tracker
│   ├── prompt_injection.py       # pattern-based prompt sanitizer
│   ├── llm_service.py            # real LLM (if key present) + deterministic mock
│   └── audit_service.py          # MongoDB-backed audit log
├── ml/
│   ├── feature_engineering.py    # pandas-based 12-feature transformer
│   ├── dataset.py                # synthetic training data generator
│   ├── train_xgboost.py          # standalone training script
│   ├── train_isolation_forest.py # standalone training script
│   ├── predict_xgboost.py        # cached loader + inference
│   ├── predict_isolation_forest.py
│   ├── bootstrap.py              # trains on first run if artifacts missing
│   └── artifacts/                # joblib model bundles (created at runtime)
├── models/
│   └── schemas.py                # Pydantic request/response models
├── utils/
│   ├── db.py                     # async MongoDB (Motor)
│   ├── seed.py                   # one-shot seeding of customers + transactions
│   └── logger.py
├── data/
│   ├── customers.json            # 10 sample customer baselines
│   ├── transactions.csv          # 500-row sample of synthetic training data
│   └── sample_transaction.json   # example POST /predict body
├── requirements.txt
└── README.md
```

## Local development

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The supervisor in this Emergent environment uses `server:app` — the two are
equivalent (`server.py` re-exports `app` from `main.py`).

### Environment variables (`backend/.env`)

| Variable             | Default                       | Purpose                          |
|----------------------|-------------------------------|----------------------------------|
| `MONGO_URL`          | `mongodb://localhost:27017`   | MongoDB connection string        |
| `DB_NAME`            | `test_database`               | Database name                    |
| `CORS_ORIGINS`       | `*`                           | Comma-separated origin list      |
| `AI_BUDGET_TOTAL`    | `2.00`                        | USD ceiling for the AI router    |
| `EMERGENT_LLM_KEY`   | _(unset)_                     | Optional — enables real LLM path |

If no LLM key is configured, `services/llm_service.py` returns a
deterministic mock that mirrors the real response shape.

## API

All routes are mounted under `/api` (Kubernetes-ingress friendly). Open
`http://localhost:8001/docs` for the interactive Swagger UI.

| Method | Path                          | Description                                            |
|--------|-------------------------------|--------------------------------------------------------|
| POST   | `/api/predict`                | Full fraud investigation for a transaction.            |
| GET    | `/api/dashboard`              | Aggregate KPIs across all stored predictions.          |
| GET    | `/api/transactions`           | List transactions (filter by customer / risk).         |
| GET    | `/api/transactions/{id}`      | Fetch a single transaction.                            |
| GET    | `/api/analysis/{id}`          | Full investigation report (txn + prediction + audit).  |
| GET    | `/api/audit`                  | Audit log entries (all or by transaction).             |
| GET    | `/api/health`                 | Model + budget health.                                 |

### Example — POST /api/predict

```bash
curl -X POST http://localhost:8001/api/predict \
  -H "Content-Type: application/json" \
  -d @data/sample_transaction.json
```

Response (truncated):

```json
{
  "transaction_id": "TX-100001",
  "fraud_probability": 92.0,
  "confidence": 95.0,
  "anomaly_score": 0.88,
  "pipeline": "Pipeline 3",
  "pipeline_code": "C",
  "risk_level": "critical",
  "selected_models": ["XGBoost", "Isolation Forest", "gpt-4.1"],
  "llm_used": true,
  "routing_reason": "Fraud probability 92.0% above 80% threshold ...",
  "estimated_cost": 0.018,
  "remaining_budget": 1.982,
  "security_status": "Sanitized",
  "recommendation": "Temporarily Hold",
  "processing_time": "840 ms"
}
```

## Training the ML models

The first call to `/api/predict` (or app startup) auto-trains and saves the
artifacts at `ml/artifacts/`. To retrain manually:

```bash
python -m ml.train_xgboost
python -m ml.train_isolation_forest
```

Both scripts emit a metadata block (`auc`, `n_train`, `version`).

## Pipeline routing

| Fraud probability | Pipeline | Behaviour                                   |
|-------------------|----------|---------------------------------------------|
| < 30 %            | A (1)    | ML-only · Auto-approve                      |
| 30 – 80 %         | B (2)    | XGBoost + Isolation Forest · OTP step-up    |
| > 80 %            | C (3)    | XGBoost + IF + LLM reasoning · Human review |

## Budget tiers

| Tier         | Model                              | Cost     |
|--------------|------------------------------------|----------|
| `ml_only`    | n/a                                | $0.000   |
| `cheap`      | gpt-4o-mini · gemini-3-flash       | $0.002   |
| `premium`    | gpt-4.1 · claude-opus-4            | $0.018   |

Tier selection is in `services/budget_manager.select_tier()`. Promoting
something to a real metering service only requires re-implementing the four
public functions of that module.

## Replacing the simulated pieces

Each simulated module exposes a stable contract so it can be swapped without
touching the rest of the codebase:

- `services/otari_router.select_pipeline(fraud_probability, anomaly_score, anomaly_count) -> RoutingDecision`
- `services/budget_manager.{remaining, total, charge, select_tier}`
- `services/prompt_injection.sanitize(prompt) -> dict`
- `services/llm_service.reason(...) -> dict`
