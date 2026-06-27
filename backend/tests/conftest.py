"""Shared fixtures for OtaRisk backend tests."""
import os
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

# Make sure frontend/.env (REACT_APP_BACKEND_URL) is available
load_dotenv(Path("/app/frontend/.env"))


def _resolve_base_url() -> str:
    url = os.environ.get("REACT_APP_BACKEND_URL")
    if not url:
        raise RuntimeError("REACT_APP_BACKEND_URL not set in /app/frontend/.env")
    return url.rstrip("/")


BASE_URL = _resolve_base_url()
LOCAL_URL = "http://localhost:8001"


@pytest.fixture(scope="session")
def base_url() -> str:
    return BASE_URL


@pytest.fixture(scope="session")
def local_url() -> str:
    return LOCAL_URL


@pytest.fixture(scope="session")
def api_client() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s
