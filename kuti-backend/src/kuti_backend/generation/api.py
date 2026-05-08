from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from kuti_backend.core.database import get_session
from kuti_backend.core.settings import Settings, get_settings
from kuti_backend.generation.repository import (
    create_generation_job,
    get_generation_board,
    get_generation_job,
    get_generation_panel,
    list_generation_boards,
    list_generation_jobs,
    update_generation_panel,
    validate_generation_board,
)
from kuti_backend.generation.schemas import (
    GenerationBoardPanelRead,
    GenerationBoardRead,
    GenerationBoardValidateRequest,
    GenerationJobCreate,
    GenerationJobRead,
    GenerationPanelUpdate,
)
from kuti_backend.projects.repository import get_project as get_project_record

router = APIRouter()
SessionDep = Annotated[Session, Depends(get_session)]


def _settings(request: Request) -> Settings:
    return getattr(request.app.state, "settings", get_settings())


def _project_or_404(session: Session, project_id: str):
    project = get_project_record(session, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _job_or_404(session: Session, project_id: str, job_id: str):
    job = get_generation_job(session, project_id, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Generation job not found")
    return job


def _board_or_404(session: Session, project_id: str, board_id: str):
    board = get_generation_board(session, project_id, board_id)
    if board is None:
        raise HTTPException(status_code=404, detail="Generation board not found")
    return board


@router.get("/projects/{project_id}/generation/jobs", response_model=list[GenerationJobRead])
def read_generation_jobs(session: SessionDep, project_id: str) -> list[GenerationJobRead]:
    _project_or_404(session, project_id)
    return list_generation_jobs(session, project_id)


@router.post("/projects/{project_id}/generation/jobs", response_model=GenerationJobRead, status_code=status.HTTP_201_CREATED)
def create_generation_job_route(request: Request, session: SessionDep, project_id: str, payload: GenerationJobCreate) -> GenerationJobRead:
    _project_or_404(session, project_id)
    try:
        return create_generation_job(session, _settings(request), project_id, payload)
    except ValueError as exc:
        message = str(exc)
        if message in {"generation_source_not_found", "generation_version_not_found", "generation_board_not_found", "generation_panel_not_found"}:
            raise HTTPException(status_code=404, detail=message) from exc
        raise HTTPException(status_code=400, detail=message) from exc


@router.get("/projects/{project_id}/generation/jobs/{job_id}", response_model=GenerationJobRead)
def read_generation_job(session: SessionDep, project_id: str, job_id: str) -> GenerationJobRead:
    _project_or_404(session, project_id)
    return _job_or_404(session, project_id, job_id)


@router.get("/projects/{project_id}/generation/boards", response_model=list[GenerationBoardRead])
def read_generation_boards(session: SessionDep, project_id: str) -> list[GenerationBoardRead]:
    _project_or_404(session, project_id)
    return list_generation_boards(session, project_id)


@router.get("/projects/{project_id}/generation/boards/{board_id}", response_model=GenerationBoardRead)
def read_generation_board(session: SessionDep, project_id: str, board_id: str) -> GenerationBoardRead:
    _project_or_404(session, project_id)
    return _board_or_404(session, project_id, board_id)


@router.post("/projects/{project_id}/generation/boards/{board_id}/validate", response_model=GenerationBoardRead)
def validate_generation_board_route(
    session: SessionDep,
    project_id: str,
    board_id: str,
    payload: GenerationBoardValidateRequest | None = Body(default=None),
) -> GenerationBoardRead:
    _project_or_404(session, project_id)
    try:
        return validate_generation_board(session, project_id, board_id, note=payload.note if payload is not None else None)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/projects/{project_id}/generation/boards/{board_id}/panels/{panel_id}", response_model=GenerationBoardPanelRead)
def update_generation_panel_route(
    session: SessionDep,
    project_id: str,
    board_id: str,
    panel_id: str,
    payload: GenerationPanelUpdate,
) -> GenerationBoardPanelRead:
    _project_or_404(session, project_id)
    try:
        return update_generation_panel(session, project_id, board_id, panel_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/projects/{project_id}/generation/boards/{board_id}/download")
def download_generation_board(session: SessionDep, project_id: str, board_id: str) -> FileResponse:
    _project_or_404(session, project_id)
    board = _board_or_404(session, project_id, board_id)
    if not board.artifact_path:
        raise HTTPException(status_code=404, detail="Generation board artifact not available")

    from pathlib import Path

    artifact = Path(board.artifact_path)
    if not artifact.exists() or not artifact.is_file():
        raise HTTPException(status_code=404, detail="Generation board artifact not found")
    return FileResponse(artifact, media_type="application/json", filename=board.artifact_name or artifact.name)


@router.get("/projects/{project_id}/generation/boards/{board_id}/panels/{panel_id}/image")
def read_generation_panel_image(session: SessionDep, project_id: str, board_id: str, panel_id: str) -> FileResponse:
    _project_or_404(session, project_id)
    panel = get_generation_panel(session, project_id, board_id, panel_id)
    if panel is None:
        raise HTTPException(status_code=404, detail="Generation panel not found")

    from pathlib import Path

    artifact = Path(panel.image_path)
    if not artifact.exists() or not artifact.is_file():
        raise HTTPException(status_code=404, detail="Generation panel image not found")
    return FileResponse(artifact, media_type="image/svg+xml", filename=panel.image_name)
