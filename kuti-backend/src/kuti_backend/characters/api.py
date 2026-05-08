from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status
from fastapi import Depends
from sqlalchemy.orm import Session

from kuti_backend.core.database import get_session
from kuti_backend.characters.repository import (
    archive_character,
    create_character,
    create_relation,
    create_voice_sample,
    delete_character,
    delete_relation,
    duplicate_character,
    get_character,
    list_characters,
    list_relations,
    list_voice_samples,
    update_character,
    update_relation,
)
from kuti_backend.characters.schemas import (
    CharacterCreate,
    CharacterDetail,
    CharacterDuplicate,
    CharacterListResponse,
    CharacterRead,
    CharacterRelationCreate,
    CharacterRelationRead,
    CharacterRelationUpdate,
    CharacterUpdate,
    VoiceSampleCreate,
    VoiceSampleRead,
)

router = APIRouter()


def _character_or_404(session: Session, project_id: str, character_id: str):
    character = get_character(session, project_id, character_id)
    if character is None:
        raise HTTPException(status_code=404, detail="Character not found")
    return character


@router.get("/projects/{project_id}/characters", response_model=CharacterListResponse)
def read_characters(session: Session = Depends(get_session), project_id: str = "") -> CharacterListResponse:
    return CharacterListResponse(items=list_characters(session, project_id))


@router.post("/projects/{project_id}/characters", response_model=CharacterRead, status_code=status.HTTP_201_CREATED)
def create_character_route(session: Session = Depends(get_session), project_id: str = "", payload: CharacterCreate = None) -> CharacterRead:
    try:
        return create_character(session, project_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get("/projects/{project_id}/characters/{character_id}", response_model=CharacterDetail)
def read_character(session: Session = Depends(get_session), project_id: str = "", character_id: str = "") -> CharacterDetail:
    character = _character_or_404(session, project_id, character_id)
    return CharacterDetail(
        **CharacterRead.model_validate(character).model_dump(),
        relations=[CharacterRelationRead.model_validate(r) for r in list_relations(session, project_id, character_id)],
        voice_samples=[VoiceSampleRead.model_validate(v) for v in list_voice_samples(session, project_id, character_id)],
        relationships_summary=" / ".join(
            [
                f"{relation.relation_type}:{relation.strength}"
                for relation in list_relations(session, project_id, character_id)
            ]
        ) or None,
    )


@router.patch("/projects/{project_id}/characters/{character_id}", response_model=CharacterRead)
def update_character_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "", payload: CharacterUpdate = None) -> CharacterRead:
    character = _character_or_404(session, project_id, character_id)
    try:
        return update_character(session, project_id, character, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/projects/{project_id}/characters/{character_id}/duplicate", response_model=CharacterRead, status_code=status.HTTP_201_CREATED)
def duplicate_character_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "", payload: CharacterDuplicate = None) -> CharacterRead:
    character = _character_or_404(session, project_id, character_id)
    try:
        return duplicate_character(session, project_id, character, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/projects/{project_id}/characters/{character_id}/archive", response_model=CharacterRead)
def archive_character_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "") -> CharacterRead:
    character = _character_or_404(session, project_id, character_id)
    return archive_character(session, character)


@router.delete("/projects/{project_id}/characters/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "") -> None:
    character = _character_or_404(session, project_id, character_id)
    delete_character(session, character)


@router.post("/projects/{project_id}/characters/{character_id}/relations", response_model=CharacterRelationRead, status_code=status.HTTP_201_CREATED)
def create_relation_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "", payload: CharacterRelationCreate = None) -> CharacterRelationRead:
    if payload.source_character_id != character_id:
        raise HTTPException(status_code=400, detail="source_character_id must match route character")
    try:
        return create_relation(session, project_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/projects/{project_id}/characters/{character_id}/relations/{relation_id}", response_model=CharacterRelationRead)
def update_relation_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "", relation_id: str = "", payload: CharacterRelationUpdate = None) -> CharacterRelationRead:
    from kuti_backend.characters.models import CharacterRelation

    relation = session.get(CharacterRelation, relation_id)
    if relation is None or relation.project_id != project_id or relation.source_character_id != character_id:
        raise HTTPException(status_code=404, detail="Relation not found")
    return update_relation(session, relation, payload)


@router.delete("/projects/{project_id}/characters/{character_id}/relations/{relation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relation_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "", relation_id: str = "") -> None:
    from kuti_backend.characters.models import CharacterRelation

    relation = session.get(CharacterRelation, relation_id)
    if relation is None or relation.project_id != project_id or relation.source_character_id != character_id:
        raise HTTPException(status_code=404, detail="Relation not found")
    delete_relation(session, relation)


@router.post("/projects/{project_id}/characters/{character_id}/voice-samples", response_model=VoiceSampleRead, status_code=status.HTTP_201_CREATED)
def create_voice_sample_route(session: Session = Depends(get_session), project_id: str = "", character_id: str = "", payload: VoiceSampleCreate = None) -> VoiceSampleRead:
    _character_or_404(session, project_id, character_id)
    return create_voice_sample(session, project_id, character_id, payload)
