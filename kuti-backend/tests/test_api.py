from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from kuti_backend.api.main import create_app
from kuti_backend.core.settings import Settings, get_settings


def test_health_and_config_endpoints(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(
        Settings(data_dir=tmp_path / "kuti-data", environment="test")
    )
    client = TestClient(app)

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    config = client.get("/api/config")
    assert config.status_code == 200
    payload = config.json()
    assert payload["appName"] == "Kuti Studio Backend"
    assert payload["openapiUrl"] == "/api/openapi.json"


def test_openapi_documentation_is_available(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(
        Settings(data_dir=tmp_path / "kuti-data", environment="test")
    )
    client = TestClient(app)

    response = client.get("/api/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "Kuti Studio Backend"
    assert "/api/health" in schema["paths"]
    assert "/api/config" in schema["paths"]
