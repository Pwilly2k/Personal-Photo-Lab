import os

import pytest
import requests
from dotenv import dotenv_values


def _resolve_base_url() -> str:
    env_url = os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    if env_url:
        return env_url.rstrip("/")

    frontend_env = dotenv_values("/app/frontend/.env")
    file_url = frontend_env.get("EXPO_BACKEND_URL") or frontend_env.get("EXPO_PUBLIC_BACKEND_URL")
    if not file_url:
        raise RuntimeError("Backend base URL is not configured in environment or frontend/.env")
    return str(file_url).rstrip("/")


@pytest.fixture(scope="session")
def base_url() -> str:
    return _resolve_base_url()


@pytest.fixture(scope="session")
def api_client() -> requests.Session:
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session
