from __future__ import annotations

import json
from copy import deepcopy
from datetime import UTC, datetime
from html import escape
from pathlib import Path
from uuid import uuid4

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from kuti_backend.core.settings import Settings
from kuti_backend.generation.providers import ModelKind, resolve_model_provider
from kuti_backend.generation.models import (
    GenerationBoard,
    GenerationBoardPanel,
    GenerationBoardStatus,
    GenerationJob,
    GenerationJobStatus,
    GenerationJobStep,
    GenerationPanelStatus,
    GenerationSourceKind,
    GenerationStepStatus,
    GenerationStrategy,
)
from kuti_backend.generation.schemas import (
    GenerationBoardPanelRead,
    GenerationBoardRead,
    GenerationJobCreate,
    GenerationJobRead,
    GenerationJobStepRead,
    GenerationPanelUpdate,
)
from kuti_backend.projects.models import Project
from kuti_backend.projects.repository import slugify
from kuti_backend.story.models import Chapter, Scene, Tome
from kuti_backend.versions.models import Version


def _project_or_404(session: Session, project_id: str) -> Project:
    project = session.get(Project, project_id)
    if project is None:
        raise ValueError("project_not_found")
    return project


def _source_or_404(session: Session, project_id: str, source_kind: GenerationSourceKind, source_id: str) -> dict[str, str]:
    if source_kind == GenerationSourceKind.scene:
        source = session.get(Scene, source_id)
        if source is None or source.project_id != project_id:
            raise ValueError("generation_source_not_found")
        return {"kind": source_kind.value, "id": source.id, "label": source.title, "slug": source.slug}

    if source_kind == GenerationSourceKind.chapter:
        source = session.get(Chapter, source_id)
        if source is None or source.project_id != project_id:
            raise ValueError("generation_source_not_found")
        return {"kind": source_kind.value, "id": source.id, "label": source.title, "slug": source.slug}

    if source_kind == GenerationSourceKind.tome:
        source = session.get(Tome, source_id)
        if source is None or source.project_id != project_id:
            raise ValueError("generation_source_not_found")
        return {"kind": source_kind.value, "id": source.id, "label": source.title, "slug": source.slug}

    raise ValueError("generation_source_kind_invalid")


def _version_or_404(session: Session, project_id: str, version_id: str | None) -> Version | None:
    if version_id is None:
        return None
    version = session.get(Version, version_id)
    if version is None or version.project_id != project_id:
        raise ValueError("generation_version_not_found")
    return version


def _generation_root(settings: Settings, project: Project, job_id: str) -> Path:
    root = settings.generation_dir / project.slug / job_id
    root.mkdir(parents=True, exist_ok=True)
    return root


def _write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


def _write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def _write_svg(path: Path, title: str, subtitle: str, prompt: str, accent: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    safe_title = escape(title, quote=True)
    safe_subtitle = escape(subtitle)
    safe_prompt = escape(prompt)
    svg = f"""<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1200\" height=\"1600\" viewBox=\"0 0 1200 1600\" role=\"img\" aria-label=\"{safe_title}\">
  <defs>
    <linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">
      <stop offset=\"0%\" stop-color=\"#f8f1e7\" />
      <stop offset=\"100%\" stop-color=\"#e7d9c3\" />
    </linearGradient>
    <linearGradient id=\"accent\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">
      <stop offset=\"0%\" stop-color=\"{accent}\" stop-opacity=\"0.95\" />
      <stop offset=\"100%\" stop-color=\"#332116\" stop-opacity=\"0.95\" />
    </linearGradient>
  </defs>
  <rect width=\"1200\" height=\"1600\" rx=\"72\" fill=\"url(#bg)\" />
  <rect x=\"70\" y=\"70\" width=\"1060\" height=\"1460\" rx=\"52\" fill=\"none\" stroke=\"#2e2015\" stroke-width=\"4\" stroke-dasharray=\"0 0\" opacity=\"0.35\" />
  <circle cx=\"960\" cy=\"260\" r=\"160\" fill=\"url(#accent)\" opacity=\"0.28\" />
  <circle cx=\"260\" cy=\"1200\" r=\"220\" fill=\"#8c5a2b\" opacity=\"0.13\" />
  <text x=\"120\" y=\"220\" fill=\"#3d2816\" font-size=\"56\" font-family=\"Georgia, serif\" letter-spacing=\"6\">KUTI STUDIO</text>
  <text x=\"120\" y=\"320\" fill=\"#1d1712\" font-size=\"90\" font-family=\"Georgia, serif\" font-weight=\"700\">{safe_title}</text>
  <text x=\"120\" y=\"410\" fill=\"#6b5746\" font-size=\"34\" font-family=\"Arial, sans-serif\">{safe_subtitle}</text>
  <rect x=\"120\" y=\"520\" width=\"960\" height=\"660\" rx=\"36\" fill=\"#fffaf2\" opacity=\"0.84\" stroke=\"#7b5b3d\" stroke-width=\"2\" />
  <text x=\"160\" y=\"610\" fill=\"#3d2816\" font-size=\"30\" font-family=\"Arial, sans-serif\" font-weight=\"700\">Render prompt</text>
  <foreignObject x=\"160\" y=\"650\" width=\"880\" height=\"470\">
    <div xmlns=\"http://www.w3.org/1999/xhtml\" style=\"font-family:Arial,sans-serif;font-size:28px;line-height:1.45;color:#2b2118;white-space:pre-wrap;\">{safe_prompt}</div>
  </foreignObject>
  <rect x=\"120\" y=\"1250\" width=\"960\" height=\"220\" rx=\"30\" fill=\"#2e2015\" opacity=\"0.92\" />
  <text x=\"160\" y=\"1338\" fill=\"#f8f1e7\" font-size=\"34\" font-family=\"Arial, sans-serif\" font-weight=\"700\">{safe_subtitle}</text>
  <text x=\"160\" y=\"1394\" fill=\"#e7d8c5\" font-size=\"24\" font-family=\"Arial, sans-serif\">Generated locally via gpt-2-images</text>
</svg>
"""
    _write_text(path, svg)


def _source_summary(session: Session, project_id: str, source_kind: GenerationSourceKind, source_id: str) -> dict[str, object]:
    source = _source_or_404(session, project_id, source_kind, source_id)
    if source_kind == GenerationSourceKind.scene:
        scene = session.get(Scene, source_id)
        assert scene is not None
        return {
            **source,
            "location": scene.location,
            "summary": scene.summary,
            "characters_json": deepcopy(scene.characters_json),
            "tags_json": deepcopy(scene.tags_json),
            "content": scene.content,
        }

    if source_kind == GenerationSourceKind.chapter:
        chapter = session.get(Chapter, source_id)
        assert chapter is not None
        scenes = list(session.scalars(select(Scene).where(Scene.project_id == project_id, Scene.chapter_id == chapter.id).order_by(Scene.order_index.asc())))
        return {
            **source,
            "summary": chapter.synopsis,
            "order_index": chapter.order_index,
            "scenes": [{"id": scene.id, "title": scene.title, "slug": scene.slug, "summary": scene.summary} for scene in scenes],
        }

    tome = session.get(Tome, source_id)
    assert tome is not None
    chapters = list(session.scalars(select(Chapter).where(Chapter.project_id == project_id, Chapter.tome_id == tome.id).order_by(Chapter.order_index.asc())))
    return {
        **source,
        "summary": tome.synopsis,
        "order_index": tome.order_index,
        "chapters": [{"id": chapter.id, "title": chapter.title, "slug": chapter.slug, "summary": chapter.synopsis} for chapter in chapters],
    }


def _strategy_plan(strategy: GenerationStrategy, source_kind: GenerationSourceKind) -> list[str]:
    if strategy == GenerationStrategy.direct:
        return ["source-analysis", "prompt-composition", "hero-panel"]

    if source_kind == GenerationSourceKind.scene:
        return ["source-analysis", "reference-board", "lighting-pass", "hero-panel"]
    if source_kind == GenerationSourceKind.chapter:
        return ["source-analysis", "beat-board", "palette-pass", "hero-panel", "alt-frame"]
    return ["source-analysis", "overview-board", "character-pass", "environment-pass", "hero-panel", "alt-frame"]


def _panel_count(strategy: GenerationStrategy, source_kind: GenerationSourceKind) -> int:
    if strategy == GenerationStrategy.direct:
        return 1 if source_kind == GenerationSourceKind.scene else 2 if source_kind == GenerationSourceKind.chapter else 3
    if source_kind == GenerationSourceKind.scene:
        return 2
    if source_kind == GenerationSourceKind.chapter:
        return 3
    return 4


def _job_title(source: dict[str, object], strategy: GenerationStrategy) -> str:
    return f"{source['label']} · {strategy.value} generation"


def _job_prompt(source: dict[str, object], strategy: GenerationStrategy, version: Version | None) -> str:
    version_clause = f" using version {version.branch_name} #{version.version_index}" if version is not None else " from the current project state"
    return (
        f"Generate {strategy.value} illustration material for {source['kind']} '{source['label']}'"
        f"{version_clause}. Use the local gpt-2-images entrypoint, keep the editorial cabinet mood, and prepare a board suitable for human validation."
    )


def _job_metadata(source: dict[str, object], version: Version | None, strategy: GenerationStrategy) -> dict[str, object]:
    metadata: dict[str, object] = {
        "source": source,
        "strategy": strategy.value,
        "entrypoint": "gpt-2-images",
    }
    if version is not None:
        metadata["source_version"] = {
            "id": version.id,
            "branch_name": version.branch_name,
            "version_index": version.version_index,
            "label": version.label,
            "summary": version.summary,
            "created_at": version.created_at.isoformat(),
        }
    return metadata


def _select_model(settings: Settings, model_key: str | None) -> dict[str, object]:
    provider = resolve_model_provider(settings, model_key, kind=ModelKind.image)
    return provider.public_dict()


def _board_metadata(job: GenerationJob, source: dict[str, object], strategy: GenerationStrategy, version: Version | None) -> dict[str, object]:
    payload = {
        "job_id": job.id,
        "source": source,
        "strategy": strategy.value,
        "entrypoint": job.entrypoint,
    }
    if version is not None:
        payload["source_version_id"] = version.id
    return payload


def _job_steps(plan: list[str], prompt: str, source: dict[str, object], panel_total: int) -> list[dict[str, object]]:
    steps: list[dict[str, object]] = []
    for index, name in enumerate(plan, start=1):
        step_prompt = f"{prompt}\nStep: {name}."
        if name == "hero-panel":
            output = f"Rendered {panel_total} candidate panel(s) for {source['label']}."
        elif name == "alt-frame":
            output = f"Prepared alternate framing for {source['label']}."
        else:
            output = f"Completed {name.replace('-', ' ')} for {source['label']}."
        steps.append({"order_index": index, "title": name.replace("-", " ").title(), "prompt": step_prompt, "output_text": output})
    return steps


def _finalize_job(session: Session, job: GenerationJob, *, status: GenerationJobStatus, progress: int, error_message: str | None = None) -> GenerationJob:
    job.status = status.value
    job.progress = progress
    job.updated_at = datetime.now(UTC)
    job.completed_at = datetime.now(UTC) if status in {GenerationJobStatus.ready, GenerationJobStatus.validated} else job.completed_at
    job.failed_at = datetime.now(UTC) if status == GenerationJobStatus.failed else job.failed_at
    job.error_message = error_message
    session.commit()
    session.refresh(job)
    return job


def _serialize_job(session: Session, job: GenerationJob) -> GenerationJobRead:
    steps = list(session.scalars(select(GenerationJobStep).where(GenerationJobStep.job_id == job.id).order_by(GenerationJobStep.order_index.asc())))
    board = session.scalar(select(GenerationBoard).where(GenerationBoard.job_id == job.id))
    board_read = None
    if board is not None:
        panels = list(session.scalars(select(GenerationBoardPanel).where(GenerationBoardPanel.board_id == board.id).order_by(GenerationBoardPanel.order_index.asc())))
        board_read = GenerationBoardRead.model_validate(board)
        board_read.panels = [GenerationBoardPanelRead.model_validate(panel) for panel in panels]
    model = job.metadata_json.get("model") if isinstance(job.metadata_json, dict) else None
    job_payload = GenerationJobRead.model_validate(job).model_dump(exclude={"steps", "board", "model_key", "model_name", "model_kind"})
    return GenerationJobRead(
        **job_payload,
        model_key=model.get("key") if isinstance(model, dict) else None,
        model_name=model.get("display_name") if isinstance(model, dict) else None,
        model_kind=model.get("kind") if isinstance(model, dict) else None,
        steps=[GenerationJobStepRead.model_validate(step) for step in steps],
        board=board_read,
    )


def list_generation_jobs(session: Session, project_id: str) -> list[GenerationJobRead]:
    stmt = select(GenerationJob).where(GenerationJob.project_id == project_id).order_by(GenerationJob.created_at.desc())
    return [_serialize_job(session, job) for job in session.scalars(stmt)]


def get_generation_job(session: Session, project_id: str, job_id: str) -> GenerationJobRead | None:
    job = session.scalar(select(GenerationJob).where(GenerationJob.project_id == project_id, GenerationJob.id == job_id))
    if job is None:
        return None
    return _serialize_job(session, job)


def list_generation_boards(session: Session, project_id: str) -> list[GenerationBoardRead]:
    stmt = select(GenerationBoard).where(GenerationBoard.project_id == project_id).order_by(GenerationBoard.created_at.desc())
    boards = []
    for board in session.scalars(stmt):
        panels = list(session.scalars(select(GenerationBoardPanel).where(GenerationBoardPanel.board_id == board.id).order_by(GenerationBoardPanel.order_index.asc())))
        board_read = GenerationBoardRead.model_validate(board)
        board_read.panels = [GenerationBoardPanelRead.model_validate(panel) for panel in panels]
        boards.append(board_read)
    return boards


def get_generation_board(session: Session, project_id: str, board_id: str) -> GenerationBoardRead | None:
    board = session.scalar(select(GenerationBoard).where(GenerationBoard.project_id == project_id, GenerationBoard.id == board_id))
    if board is None:
        return None
    panels = list(session.scalars(select(GenerationBoardPanel).where(GenerationBoardPanel.board_id == board.id).order_by(GenerationBoardPanel.order_index.asc())))
    board_read = GenerationBoardRead.model_validate(board)
    board_read.panels = [GenerationBoardPanelRead.model_validate(panel) for panel in panels]
    return board_read


def get_generation_panel(session: Session, project_id: str, board_id: str, panel_id: str) -> GenerationBoardPanelRead | None:
    board = session.scalar(select(GenerationBoard).where(GenerationBoard.project_id == project_id, GenerationBoard.id == board_id))
    if board is None:
        return None
    panel = session.scalar(select(GenerationBoardPanel).where(GenerationBoardPanel.board_id == board.id, GenerationBoardPanel.id == panel_id))
    if panel is None:
        return None
    return GenerationBoardPanelRead.model_validate(panel)


def create_generation_job(session: Session, settings: Settings, project_id: str, payload: GenerationJobCreate) -> GenerationJobRead:
    project = _project_or_404(session, project_id)
    source_kind = GenerationSourceKind(payload.source_kind)
    strategy = GenerationStrategy(payload.strategy)
    source = _source_or_404(session, project_id, source_kind, payload.source_id)
    version = _version_or_404(session, project_id, payload.source_version_id)
    model = _select_model(settings, payload.model_key)
    job_id = str(uuid4())
    job = GenerationJob(
        id=job_id,
        project_id=project_id,
        source_kind=source_kind.value,
        source_id=payload.source_id,
        source_label=source["label"],
        source_version_id=version.id if version is not None else None,
        strategy=strategy.value,
        entrypoint="gpt-2-images",
        title=payload.title or _job_title(source, strategy),
        prompt=_job_prompt(source, strategy, version),
        summary=payload.summary,
        status=GenerationJobStatus.running.value,
        progress=15,
        metadata_json={**_job_metadata(source, version, strategy), "model": model},
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    session.add(job)
    session.flush()

    root = _generation_root(settings, project, job.id)
    prompt_path = root / "prompt.txt"
    _write_text(prompt_path, job.prompt)

    steps_payload = _job_steps(_strategy_plan(strategy, source_kind), job.prompt, source, _panel_count(strategy, source_kind))
    step_records: list[GenerationJobStep] = []
    for item in steps_payload:
        step_id = str(uuid4())
        step_path = root / f"step-{item['order_index']:02d}.txt"
        _write_text(step_path, f"{item['title']}\n\n{item['output_text']}\n")
        step = GenerationJobStep(
            id=step_id,
            job_id=job.id,
            order_index=item["order_index"],
            title=item["title"],
            status=GenerationStepStatus.ready.value,
            prompt=item["prompt"],
            output_text=item["output_text"],
            artifact_path=str(step_path),
            artifact_name=step_path.name,
            metadata_json={"source_kind": source_kind.value, "strategy": strategy.value},
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
            completed_at=datetime.now(UTC),
        )
        session.add(step)
        step_records.append(step)

    board_id = str(uuid4())
    board_root = root / "board"
    board_root.mkdir(parents=True, exist_ok=True)
    board = GenerationBoard(
        id=board_id,
        project_id=project_id,
        job_id=job.id,
        source_kind=source_kind.value,
        strategy=strategy.value,
        title=f"{source['label']} board",
        summary=payload.summary,
        status=GenerationBoardStatus.draft.value,
        artifact_path=str(board_root / "board.json"),
        artifact_name="board.json",
        metadata_json=_board_metadata(job, source, strategy, version),
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    session.add(board)
    session.flush()

    panel_total = _panel_count(strategy, source_kind)
    panel_sources = step_records[-panel_total:] if len(step_records) >= panel_total else step_records
    panels_payload: list[dict[str, object]] = []
    for index in range(panel_total):
        step_ref = panel_sources[min(index, len(panel_sources) - 1)] if panel_sources else None
        panel_id = str(uuid4())
        panel_title = f"Panel {index + 1}"
        panel_path = board_root / f"panel-{index + 1}.svg"
        accent = ["#8c5a2b", "#3d2816", "#b47a44", "#6f7d8d"][index % 4]
        _write_svg(
            panel_path,
            panel_title,
            f"{source['label']} · {strategy.value}",
            f"{job.prompt}\n\nPanel {index + 1} of {panel_total}",
            accent,
        )
        panel = GenerationBoardPanel(
            id=panel_id,
            board_id=board.id,
            step_id=step_ref.id if step_ref is not None else None,
            order_index=index + 1,
            title=panel_title,
            caption=f"{source['label']} panel {index + 1}",
            prompt=job.prompt,
            status=GenerationPanelStatus.draft.value,
            image_path=str(panel_path),
            image_name=panel_path.name,
            metadata_json={"panel_index": index + 1, "strategy": strategy.value, "source_kind": source_kind.value},
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        session.add(panel)
        panels_payload.append({"order_index": index + 1, "title": panel_title, "caption": panel.caption, "image": panel.image_name})

    _write_json(board_root / "board.json", {"board": board.title, "job_id": job.id, "panels": panels_payload})
    job.metadata_json = {**job.metadata_json, "artifact_root": str(root), "board_id": board.id, "prompt_path": str(prompt_path)}
    job.status = GenerationJobStatus.ready.value
    job.progress = 100
    job.completed_at = datetime.now(UTC)
    job.updated_at = datetime.now(UTC)
    session.commit()
    session.refresh(job)
    return _serialize_job(session, job)


def validate_generation_board(session: Session, project_id: str, board_id: str, note: str | None = None) -> GenerationBoardRead:
    board = session.scalar(select(GenerationBoard).where(GenerationBoard.project_id == project_id, GenerationBoard.id == board_id))
    if board is None:
        raise ValueError("generation_board_not_found")
    board.status = GenerationBoardStatus.validated.value
    board.validated_at = datetime.now(UTC)
    board.updated_at = datetime.now(UTC)
    board.metadata_json = {**board.metadata_json, "validation_note": note}
    job = session.scalar(select(GenerationJob).where(GenerationJob.id == board.job_id))
    if job is not None:
        job.status = GenerationJobStatus.validated.value
        job.progress = 100
        job.completed_at = datetime.now(UTC)
        job.updated_at = datetime.now(UTC)
        job.metadata_json = {**job.metadata_json, "validated": True, "validation_note": note}
    session.commit()
    board_read = get_generation_board(session, project_id, board_id)
    if board_read is None:
        raise ValueError("generation_board_not_found")
    return board_read


def update_generation_panel(session: Session, project_id: str, board_id: str, panel_id: str, payload: GenerationPanelUpdate) -> GenerationBoardPanelRead:
    board = session.scalar(select(GenerationBoard).where(GenerationBoard.project_id == project_id, GenerationBoard.id == board_id))
    if board is None:
        raise ValueError("generation_board_not_found")
    panel = session.scalar(select(GenerationBoardPanel).where(GenerationBoardPanel.board_id == board_id, GenerationBoardPanel.id == panel_id))
    if panel is None:
        raise ValueError("generation_panel_not_found")
    if payload.status is not None:
        panel.status = GenerationPanelStatus(payload.status).value
    if payload.caption is not None:
        panel.caption = payload.caption
    if payload.title is not None:
        panel.title = payload.title
    panel.updated_at = datetime.now(UTC)
    session.commit()
    session.refresh(panel)
    return GenerationBoardPanelRead.model_validate(panel)
