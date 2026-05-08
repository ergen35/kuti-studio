from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from kuti_backend.core.paths import default_data_dir


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="KUTI_",
        extra="ignore",
    )

    app_name: str = "Kuti Studio Backend"
    app_version: str = "0.1.0"
    environment: str = Field(default="development")
    locale: str = Field(default="en")
    data_dir: Path = Field(default_factory=default_data_dir)

    @property
    def project_data_dir(self) -> Path:
        return self.data_dir / "projects"

    @property
    def exports_dir(self) -> Path:
        return self.data_dir / "exports"

    @property
    def openapi_path(self) -> str:
        return "/api/openapi.json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    settings.project_data_dir.mkdir(parents=True, exist_ok=True)
    settings.exports_dir.mkdir(parents=True, exist_ok=True)
    return settings
