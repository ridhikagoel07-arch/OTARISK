"""Audit log persistence."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from utils.db import get_db


async def append(transaction_id: str, entries: Iterable[dict]) -> None:
    docs = [
        {
            **e,
            "transaction_id": transaction_id,
            "created_at": e.get("created_at") or datetime.now(timezone.utc).isoformat(),
        }
        for e in entries
    ]
    if docs:
        await get_db().audit_logs.insert_many(docs)


async def for_transaction(transaction_id: str) -> list[dict]:
    cur = (
        get_db()
        .audit_logs.find({"transaction_id": transaction_id}, {"_id": 0})
        .sort("created_at", 1)
    )
    return await cur.to_list(500)


async def recent(limit: int = 100) -> list[dict]:
    cur = get_db().audit_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    return await cur.to_list(limit)
