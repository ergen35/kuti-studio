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


def test_character_profiles_and_relations(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(Settings(data_dir=tmp_path / "kuti-data", environment="test"))
    client = TestClient(app)

    project = client.post("/api/projects", json={"name": "Atlas Sector"}).json()

    created = client.post(
        f"/api/projects/{project['id']}/characters",
        json={
            "name": "Jack Vespers",
            "alias": "The Lantern",
            "narrative_role": "protagonist",
            "description": "A cautious rebel from the docks.",
            "physical_description": "Lean frame, silver scar over the left brow.",
            "color_palette_json": ["#121212", "#d4a24c", "#f0e6d2"],
            "costume_elements_json": ["long coat", "brass buckle", "fingerless gloves"],
            "key_traits_json": ["observant", "guarded", "resourceful"],
            "personality": "Soft-spoken but relentless when cornered.",
            "narrative_arc": "Learns to trust a crew and lead openly.",
            "tags_json": ["lead", "dockside", "noir"],
        },
    )
    assert created.status_code == 201
    character = created.json()
    assert character["slug"] == "jack-vespers"

    slug_collision = client.post(
        f"/api/projects/{project['id']}/characters",
        json={
            "name": "Jack Vespers!",
            "narrative_role": "supporting",
        },
    )
    assert slug_collision.status_code == 201
    assert slug_collision.json()["slug"] == "jack-vespers-2"

    renamed = client.patch(
        f"/api/projects/{project['id']}/characters/{character['id']}",
        json={"name": "Jack Vesper Renamed"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["slug"] == "jack-vespers"

    detail = client.get(f"/api/projects/{project['id']}/characters/{character['id']}")
    assert detail.status_code == 200
    assert detail.json()["physical_description"].startswith("Lean frame")
    assert detail.json()["color_palette_json"] == ["#121212", "#d4a24c", "#f0e6d2"]

    updated = client.patch(
        f"/api/projects/{project['id']}/characters/{character['id']}",
        json={
            "personality": "Measured and defiant.",
            "tags_json": ["lead", "docks", "noir"],
        },
    )
    assert updated.status_code == 200
    assert updated.json()["personality"] == "Measured and defiant."

    duplicate = client.post(
        f"/api/projects/{project['id']}/characters/{character['id']}/duplicate",
        json={"name": "Jack Vespers Variant"},
    )
    assert duplicate.status_code == 201

    relation = client.post(
        f"/api/projects/{project['id']}/characters/{character['id']}/relations",
        json={
            "source_character_id": character["id"],
            "target_character_id": duplicate.json()["id"],
            "relation_type": "rival",
            "strength": 72,
            "narrative_dependency": "Their choices drive the central break.",
            "notes": "Keep the tension visible in scenes 2 and 4.",
        },
    )
    assert relation.status_code == 201

    relation_id = relation.json()["id"]

    inbound_update = client.patch(
        f"/api/projects/{project['id']}/characters/{duplicate.json()['id']}/relations/{relation_id}",
        json={"notes": "Update from the target side."},
    )
    assert inbound_update.status_code == 200
    assert inbound_update.json()["notes"] == "Update from the target side."

    duplicate_relation = client.post(
        f"/api/projects/{project['id']}/characters/{character['id']}/relations",
        json={
            "source_character_id": character["id"],
            "target_character_id": duplicate.json()["id"],
            "relation_type": "rival",
            "strength": 72,
        },
    )
    assert duplicate_relation.status_code == 409

    voice = client.post(
        f"/api/projects/{project['id']}/characters/{character['id']}/voice-samples",
        json={"label": "calm low register", "voice_notes": "Slow, intimate phrasing."},
    )
    assert voice.status_code == 201

    refreshed = client.get(f"/api/projects/{project['id']}/characters/{character['id']}")
    assert refreshed.status_code == 200
    assert refreshed.json()["relationships_summary"] is not None
    assert len(refreshed.json()["relations"]) == 1
    assert len(refreshed.json()["voice_samples"]) == 1

    deleted = client.delete(f"/api/projects/{project['id']}/characters/{duplicate.json()['id']}/relations/{relation_id}")
    assert deleted.status_code == 204

    deleted_character = client.delete(f"/api/projects/{project['id']}/characters/{character['id']}")
    assert deleted_character.status_code == 204

    remaining = client.get(f"/api/projects/{project['id']}/characters")
    assert remaining.status_code == 200
    assert len(remaining.json()["items"]) == 2


def test_story_references_use_stable_slugs(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(Settings(data_dir=tmp_path / "kuti-data", environment="test"))
    client = TestClient(app)

    project = client.post("/api/projects", json={"name": "Night Harbor"}).json()
    character = client.post(
        f"/api/projects/{project['id']}/characters",
        json={"name": "Mara Vale", "narrative_role": "lead"},
    ).json()

    tome = client.post(
        f"/api/projects/{project['id']}/story/tomes",
        json={"title": "Volume One"},
    ).json()
    chapter = client.post(
        f"/api/projects/{project['id']}/story/chapters",
        json={"tome_id": tome["id"], "title": "Opening"},
    ).json()
    scene = client.post(
        f"/api/projects/{project['id']}/story/scenes",
        json={
            "tome_id": tome["id"],
            "chapter_id": chapter["id"],
            "title": "Dockside Arrival",
            "content": "Mara steps into frame as @character:mara-vale.",
        },
    ).json()

    summary = client.get(f"/api/projects/{project['id']}/story")
    assert summary.status_code == 200
    assert summary.json()["orphan_references"] == []

    renamed = client.patch(
        f"/api/projects/{project['id']}/characters/{character['id']}",
        json={"name": "Mara Vale Prime"},
    )
    assert renamed.status_code == 200
    assert renamed.json()["slug"] == "mara-vale"

    references = client.get(f"/api/projects/{project['id']}/story/references", params={"scene_id": scene["id"]})
    assert references.status_code == 200
    assert references.json()[0]["target_slug"] == "mara-vale"

    story = client.get(f"/api/projects/{project['id']}/story")
    assert story.status_code == 200
    assert story.json()["orphan_references"] == []


def test_story_slugs_are_project_unique(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(Settings(data_dir=tmp_path / "kuti-data", environment="test"))
    client = TestClient(app)

    project = client.post("/api/projects", json={"name": "Atlas Archive"}).json()
    tome_a = client.post(f"/api/projects/{project['id']}/story/tomes", json={"title": "Tome A"}).json()
    tome_b = client.post(f"/api/projects/{project['id']}/story/tomes", json={"title": "Tome B"}).json()

    chapter_a = client.post(
        f"/api/projects/{project['id']}/story/chapters",
        json={"tome_id": tome_a["id"], "title": "Prologue"},
    ).json()
    chapter_b = client.post(
        f"/api/projects/{project['id']}/story/chapters",
        json={"tome_id": tome_b["id"], "title": "Prologue"},
    ).json()

    assert chapter_a["slug"] == "prologue"
    assert chapter_b["slug"] == "prologue-2"

    scene_a = client.post(
        f"/api/projects/{project['id']}/story/scenes",
        json={"tome_id": tome_a["id"], "chapter_id": chapter_a["id"], "title": "Arrival"},
    ).json()
    scene_b = client.post(
        f"/api/projects/{project['id']}/story/scenes",
        json={"tome_id": tome_b["id"], "chapter_id": chapter_b["id"], "title": "Arrival"},
    ).json()

    assert scene_a["slug"] == "arrival"
    assert scene_b["slug"] == "arrival-2"


def test_asset_import_and_usage_links(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(Settings(data_dir=tmp_path / "kuti-data", environment="test"))
    client = TestClient(app)

    project = client.post("/api/projects", json={"name": "Media House"}).json()
    character = client.post(
        f"/api/projects/{project['id']}/characters",
        json={"name": "Sera Loom", "narrative_role": "lead"},
    ).json()

    source_file = tmp_path / "reference.png"
    source_file.write_bytes(b"fake-image-bytes")

    imported = client.post(
        f"/api/projects/{project['id']}/assets/import",
        json={
            "source_path": str(source_file),
            "name": "Reference Plate",
            "slug": "reference-plate",
            "description": "Primary visual reference.",
            "tags_json": ["reference", "image"],
            "mime_type": "image/png",
        },
    )
    assert imported.status_code == 201
    asset = imported.json()
    assert asset["slug"] == "reference-plate"
    assert asset["status"] == "active"

    asset_file = Path(asset["storage_path"])
    assert asset_file.exists()

    listed = client.get(f"/api/projects/{project['id']}/assets")
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1

    detail = client.get(f"/api/projects/{project['id']}/assets/{asset['id']}")
    assert detail.status_code == 200
    assert detail.json()["links"] == []

    link = client.post(
        f"/api/projects/{project['id']}/assets/{asset['id']}/links",
        json={
            "asset_id": asset["id"],
            "target_kind": "character",
            "target_id": character["id"],
            "note": "Palette source for the lead character.",
        },
    )
    assert link.status_code == 201

    missing_target = client.post(
        f"/api/projects/{project['id']}/assets/{asset['id']}/links",
        json={
            "asset_id": asset["id"],
            "target_kind": "scene",
            "target_id": "missing-scene-id",
            "note": "Invalid reference should be rejected.",
        },
    )
    assert missing_target.status_code == 404

    detail_with_link = client.get(f"/api/projects/{project['id']}/assets/{asset['id']}")
    assert detail_with_link.status_code == 200
    assert len(detail_with_link.json()["links"]) == 1

    archived = client.post(f"/api/projects/{project['id']}/assets/{asset['id']}/archive")
    assert archived.status_code == 200
    assert archived.json()["status"] == "archived"

    deleted_link = client.delete(f"/api/projects/{project['id']}/assets/{asset['id']}/links/{link.json()['id']}")
    assert deleted_link.status_code == 204

    deleted = client.delete(f"/api/projects/{project['id']}/assets/{asset['id']}")
    assert deleted.status_code == 204
    assert not asset_file.exists()


def test_versioning_checkpoints_compare_and_restore(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(Settings(data_dir=tmp_path / "kuti-data", environment="test"))
    client = TestClient(app)

    project = client.post("/api/projects", json={"name": "Signal Archive", "status": "draft"}).json()
    project_id = project["id"]

    first_character = client.post(
        f"/api/projects/{project_id}/characters",
        json={"name": "Mina Vale", "narrative_role": "lead"},
    ).json()
    assert first_character["slug"] == "mina-vale"

    version_one = client.post(
        f"/api/projects/{project_id}/versions",
        json={"branch_name": "main", "label": "Initial draft", "summary": "First capture"},
    )
    assert version_one.status_code == 201
    v1 = version_one.json()
    assert v1["version_index"] == 1

    client.patch(
        f"/api/projects/{project_id}",
        json={"name": "Signal Archive Revised", "status": "active"},
    )

    second_character = client.post(
        f"/api/projects/{project_id}/characters",
        json={"name": "Orin Gale", "narrative_role": "supporting"},
    ).json()
    assert second_character["slug"] == "orin-gale"

    tome = client.post(
        f"/api/projects/{project_id}/story/tomes",
        json={"title": "Volume One"},
    ).json()
    assert tome["slug"] == "volume-one"

    version_two = client.post(
        f"/api/projects/{project_id}/versions",
        json={"branch_name": "main", "label": "Revision one", "summary": "Added a second lead and a tome"},
    )
    assert version_two.status_code == 201
    v2 = version_two.json()
    assert v2["version_index"] == 2

    client.patch(f"/api/projects/{project_id}", json={"status": "maintenance"})
    client.post(f"/api/projects/{project_id}/story/chapters", json={"tome_id": tome["id"], "title": "Opening"})

    version_three = client.post(
        f"/api/projects/{project_id}/versions",
        json={"branch_name": "main", "label": "Working copy", "summary": "Temporary maintenance branch state"},
    )
    assert version_three.status_code == 201
    v3 = version_three.json()
    assert v3["version_index"] == 3

    comparison = client.post(
        f"/api/projects/{project_id}/versions/compare",
        json={"left_version_id": v1["id"], "right_version_id": v2["id"]},
    )
    assert comparison.status_code == 200
    compare_payload = comparison.json()
    assert "project.name" in compare_payload["project_changes"]
    assert "project.status" in compare_payload["project_changes"]
    assert compare_payload["counts_delta"]["characters"] == 1
    assert compare_payload["counts_delta"]["tomes"] == 1
    assert compare_payload["counts_delta"]["relations"] == 0
    assert compare_payload["counts_delta"]["story_references"] == 0

    client.patch(f"/api/projects/{project_id}", json={"name": "Signal Archive Final"})

    version_four = client.post(
        f"/api/projects/{project_id}/versions",
        json={"branch_name": "main", "label": "Pre-restore", "summary": "Later project state"},
    )
    assert version_four.status_code == 201
    assert version_four.json()["version_index"] == 4

    restore = client.post(
        f"/api/projects/{project_id}/versions/{v2['id']}/restore",
        json={"label": "Restored from revision one", "summary": "Checkpoint after rollback"},
    )
    assert restore.status_code == 201
    restored = restore.json()
    assert restored["version_index"] == 5
    assert restored["label"] == "Restored from revision one"

    project_after_restore = client.get(f"/api/projects/{project_id}")
    assert project_after_restore.status_code == 200
    assert project_after_restore.json()["name"] == "Signal Archive Revised"
    assert project_after_restore.json()["status"] == "active"

    story_after_restore = client.get(f"/api/projects/{project_id}/story")
    assert story_after_restore.status_code == 200
    assert len(story_after_restore.json()["tomes"]) == 1
    assert len(story_after_restore.json()["chapters"]) == 0

    versions_after_restore = client.get(f"/api/projects/{project_id}/versions")
    assert versions_after_restore.status_code == 200
    assert [item["version_index"] for item in versions_after_restore.json()] == [5, 4, 3]

    branches_after_restore = client.get(f"/api/projects/{project_id}/versions/branches")
    assert branches_after_restore.status_code == 200
    assert branches_after_restore.json() == [
        {
            "branch_name": "main",
            "version_count": 3,
            "latest_version_id": restored["id"],
            "latest_created_at": restored["created_at"],
        }
    ]


def test_character_routes_require_existing_project(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("KUTI_DATA_DIR", str(tmp_path / "kuti-data"))
    get_settings.cache_clear()
    app = create_app(Settings(data_dir=tmp_path / "kuti-data", environment="test"))
    client = TestClient(app)

    response = client.get("/api/projects/missing/characters")
    assert response.status_code == 404
