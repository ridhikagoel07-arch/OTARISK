"""Async MongoDB client and helpers.

A single Motor client is created lazily and reused across the app's lifetime.
Collections:
  - customers         : customer profile + behavioural baseline
  - transactions      : historical / streaming transactions
  - predictions       : every /predict result, indexed by transaction_id
  - audit_logs        : append-only audit trail per investigation
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger("otarisk.db")

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        url = os.environ["MONGO_URL"]
        _client = AsyncIOMotorClient(url, uuidRepresentation="standard")
    return _client


def get_db() -> AsyncIOMotorDatabase:
    global _db
    if _db is None:
        _db = get_client()[os.environ["DB_NAME"]]
    return _db


async def init_db() -> None:
    db = get_db()
    # Indexes (idempotent)
    await db.customers.create_index("customer_id", unique=True)
    await db.transactions.create_index("transaction_id", unique=True)
    await db.transactions.create_index("customer_id")
    await db.transactions.create_index("timestamp")
    await db.predictions.create_index("transaction_id", unique=True)
    await db.audit_logs.create_index("transaction_id")
    await db.audit_logs.create_index("created_at")
    logger.info("MongoDB indexes ensured (db=%s).", os.environ["DB_NAME"])


async def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None
