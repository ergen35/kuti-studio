from __future__ import annotations

from dataclasses import asdict, dataclass
from enum import StrEnum

from kuti_backend.core.settings import Settings


class ModelKind(StrEnum):
    video = "video"
    image = "image"
    audio = "audio"


class ModelKey(StrEnum):
    sora_2 = "sora_2"
    seedance_2 = "seedance_2"
    gpt_images_1_5 = "gpt_images_1_5"
    gpt_images_2 = "gpt_images_2"
    eleven_labs = "eleven_labs"


@dataclass(frozen=True)
class ModelProviderConfig:
    key: str
    kind: ModelKind
    display_name: str
    base_url: str | None
    api_key: str | None
    enabled: bool

    @property
    def configured(self) -> bool:
        return self.enabled and bool((self.base_url or "").strip()) and bool((self.api_key or "").strip())

    def public_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["kind"] = self.kind.value
        payload.pop("api_key", None)
        payload["configured"] = self.configured
        payload["has_api_key"] = bool((self.api_key or "").strip())
        return payload


def build_model_catalog(settings: Settings) -> dict[str, ModelProviderConfig]:
    return {
        ModelKey.sora_2.value: ModelProviderConfig(
            key=ModelKey.sora_2.value,
            kind=ModelKind.video,
            display_name="Sora 2",
            base_url=settings.sora_2_base_url,
            api_key=settings.sora_2_api_key,
            enabled=settings.sora_2_enabled,
        ),
        ModelKey.seedance_2.value: ModelProviderConfig(
            key=ModelKey.seedance_2.value,
            kind=ModelKind.video,
            display_name="Seedance 2",
            base_url=settings.seedance_2_base_url,
            api_key=settings.seedance_2_api_key,
            enabled=settings.seedance_2_enabled,
        ),
        ModelKey.gpt_images_1_5.value: ModelProviderConfig(
            key=ModelKey.gpt_images_1_5.value,
            kind=ModelKind.image,
            display_name="GPT Images 1.5",
            base_url=settings.gpt_images_1_5_base_url,
            api_key=settings.gpt_images_1_5_api_key,
            enabled=settings.gpt_images_1_5_enabled,
        ),
        ModelKey.gpt_images_2.value: ModelProviderConfig(
            key=ModelKey.gpt_images_2.value,
            kind=ModelKind.image,
            display_name="GPT Images 2",
            base_url=settings.gpt_images_2_base_url,
            api_key=settings.gpt_images_2_api_key,
            enabled=settings.gpt_images_2_enabled,
        ),
        ModelKey.eleven_labs.value: ModelProviderConfig(
            key=ModelKey.eleven_labs.value,
            kind=ModelKind.audio,
            display_name="Eleven Labs",
            base_url=settings.eleven_labs_base_url,
            api_key=settings.eleven_labs_api_key,
            enabled=settings.eleven_labs_enabled,
        ),
    }


def public_model_catalog(settings: Settings) -> list[dict[str, object]]:
    return [provider.public_dict() for provider in build_model_catalog(settings).values()]


def resolve_model_provider(settings: Settings, model_key: str | None = None, *, kind: ModelKind | None = None) -> ModelProviderConfig:
    catalog = build_model_catalog(settings)
    if model_key:
        provider = catalog.get(model_key)
        if provider is None:
            raise ValueError("model_not_found")
    else:
        if kind is None:
            provider = catalog[ModelKey.gpt_images_2.value]
        else:
            preferred_keys = {
                ModelKind.video: (ModelKey.sora_2.value, ModelKey.seedance_2.value),
                ModelKind.image: (ModelKey.gpt_images_2.value, ModelKey.gpt_images_1_5.value),
                ModelKind.audio: (ModelKey.eleven_labs.value,),
            }[kind]
            provider = next((catalog[key] for key in preferred_keys if key in catalog and catalog[key].kind == kind and catalog[key].configured), None)
            if provider is None:
                raise ValueError("model_not_configured")

    if not provider.enabled:
        raise ValueError("model_disabled")
    if not provider.configured:
        raise ValueError("model_missing_configuration")
    if kind is not None and provider.kind != kind:
        raise ValueError("model_kind_mismatch")
    return provider
