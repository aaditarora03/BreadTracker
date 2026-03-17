import os
from pathlib import Path
from dotenv import load_dotenv
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

# Always load server/.env no matter where the process is started from.
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

engine = None
SessionLocal = None


def _get_session_local():
    global engine, SessionLocal

    if SessionLocal is not None:
        return SessionLocal

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(
            status_code=500,
            detail="DATABASE_URL is not configured on the server.",
        )

    engine = create_engine(database_url, echo=True, future=True)
    SessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        class_=Session,
    )
    return SessionLocal

def get_session():
    session_local = _get_session_local()
    with session_local() as session:
        yield session