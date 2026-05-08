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


def test_project_crud_and_portable_files(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(Settings(data_dir=tmp_path / "kuti-data", environment="test"))
    client = TestClient(app)

    created = client.post("/api/projects", json={"name": "Moon Docks", "settings_json": {"theme": "noir"}})
    assert created.status_code == 201
    project = created.json()
    project_id = project["id"]
    slug = project["slug"]

    listed = client.get("/api/projects")
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1

    detail = client.get(f"/api/projects/{project_id}")
    assert detail.status_code == 200
    assert detail.json()["name"] == "Moon Docks"

    updated = client.patch(f"/api/projects/{project_id}", json={"name": "Moon Docks Revised", "status": "active"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Moon Docks Revised"
    assert updated.json()["status"] == "active"

    opened = client.post(f"/api/projects/{project_id}/open")
    assert opened.status_code == 200
    assert opened.json()["last_opened_at"] is not None

    cloned = client.post(f"/api/projects/{project_id}/clone", json={"name": "Moon Docks Clone"})
    assert cloned.status_code == 201
    assert cloned.json()["name"] == "Moon Docks Clone"
    assert cloned.json()["slug"] != slug

    archived = client.post(f"/api/projects/{project_id}/archive")
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"

    exported = client.get(f"/api/projects/{project_id}/export")
    assert exported.status_code == 200
    assert exported.json()["slug"] == slug

    assert (tmp_path / "kuti-data" / "projects" / slug / "project.json").exists()
