from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Iterator

from fastapi import Request
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker

from kuti_backend.core.settings import Settings


def _database_path(settings: Settings) -> Path:
    db_dir = settings.data_dir / "db"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "kuti.sqlite"


@lru_cache(maxsize=8)
def get_engine(database_url: str) -> Engine:
    return create_engine(database_url, future=True, connect_args={"check_same_thread": False})


def build_engine(settings: Settings) -> Engine:
    return get_engine(f"sqlite:///{_database_path(settings)}")


def build_session_factory(engine: Engine):
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_session(request: Request) -> Iterator[Session]:
    session_factory = getattr(request.app.state, "session_factory", None)
    if session_factory is None:
        session_factory = build_session_factory(request.app.state.engine)
        request.app.state.session_factory = session_factory
    session: Session = session_factory()
    try:
        yield session
    finally:
        session.close()


def init_database(settings: Settings) -> Engine:
    from kuti_backend.projects.models import Base
    import kuti_backend.assets.models  # noqa: F401
    import kuti_backend.characters.models  # noqa: F401
    import kuti_backend.story.models  # noqa: F401

    engine = build_engine(settings)
    Base.metadata.create_all(bind=engine)
    return engine
