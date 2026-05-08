from __future__ import annotations

from datetime import datetime, UTC

from fastapi import APIRouter

from kuti_backend.core.settings import get_settings

router = APIRouter()


@router.get("/health")
def health() -> dict[str, object]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.now(UTC).isoformat(),
        "dataDir": str(settings.data_dir),
    }


@router.get("/config")
def config() -> dict[str, object]:
    settings = get_settings()
    return {
        "appName": settings.app_name,
        "appVersion": settings.app_version,
        "environment": settings.environment,
        "locale": settings.locale,
        "dataDir": str(settings.data_dir),
        "projectDataDir": str(settings.project_data_dir),
        "exportsDir": str(settings.exports_dir),
        "openapiUrl": settings.openapi_path,
    }
