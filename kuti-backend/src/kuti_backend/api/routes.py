from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Request

from kuti_backend.core.settings import get_settings
from kuti_backend.projects.api import router as projects_router

router = APIRouter()
router.include_router(projects_router)


def _settings(request: Request):
    return getattr(request.app.state, "settings", get_settings())


@router.get("/health")
def health(request: Request) -> dict[str, object]:
    settings = _settings(request)
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.now(UTC).isoformat(),
        "dataDir": str(settings.data_dir),
    }


@router.get("/config")
def config(request: Request) -> dict[str, object]:
    settings = _settings(request)
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
