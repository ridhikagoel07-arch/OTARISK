"""Seed MongoDB with sample customers + a small synthetic transaction history."""
from __future__ import annotations

import json
import logging
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from utils.db import get_db

logger = logging.getLogger("otarisk.seed")

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

MERCHANTS = [
    "Amazon", "Netflix", "Uber Eats", "Spotify", "Whole Foods", "Apple Store",
    "Delta Air Lines", "Bet365", "Steam Games", "Rolex Boutique",
    "Bloomingdale's", "Zara", "Costco", "Shell Gas", "Crypto.com", "Coinbase",
]
DEVICES = [
    "iPhone 15 Pro · iOS 17.4",
    "Pixel 8 · Android 14",
    "MacBook Pro · Safari 17.2",
    "Windows 11 · Chrome 122",
    "Galaxy S24 · Android 14",
]


async def seed_if_empty() -> None:
    db = get_db()
    customers_count = await db.customers.count_documents({})
    if customers_count == 0:
        await _seed_customers()
    txns_count = await db.transactions.count_documents({})
    if txns_count == 0:
        await _seed_transactions()


async def _seed_customers() -> None:
    db = get_db()
    customers_path = DATA_DIR / "customers.json"
    with customers_path.open() as f:
        customers = json.load(f)
    if customers:
        await db.customers.insert_many(customers)
        logger.info("Seeded %d customers.", len(customers))


async def _seed_transactions() -> None:
    db = get_db()
    customers = await db.customers.find({}, {"_id": 0}).to_list(100)
    if not customers:
        return

    rng = random.Random(7)
    rows: list[dict] = []
    base = datetime.now(timezone.utc) - timedelta(days=14)
    for i in range(220):
        cust = rng.choice(customers)
        merchant = rng.choice(cust["known_merchants"] + MERCHANTS)
        device = rng.choice(cust["known_devices"] + DEVICES)
        amount = round(max(2.0, rng.gauss(cust["baseline_avg_amount"], cust["baseline_avg_amount"] * 0.6)), 2)
        country = cust["home_country"] if rng.random() < 0.85 else rng.choice(["USA", "UK", "UAE", "Singapore", "Brazil"])
        city = cust["home_city"] if country == cust["home_country"] else "Foreign City"
        ts = base + timedelta(minutes=rng.randint(0, 14 * 24 * 60))
        rows.append(
            {
                "transaction_id": f"TX-{200000 + i}",
                "customer_id": cust["customer_id"],
                "amount": amount,
                "currency": "USD",
                "merchant": merchant,
                "merchant_category": "General",
                "city": city,
                "country": country,
                "device": device,
                "channel": "online",
                "timestamp": ts.isoformat(),
            }
        )
    await db.transactions.insert_many(rows)
    logger.info("Seeded %d historical transactions.", len(rows))
