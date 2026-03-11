import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = None
SessionLocal = None


def _get_session_local():
    global engine, SessionLocal

    if SessionLocal is not None:
        return SessionLocal

    if not DATABASE_URL:
        raise HTTPException(
            status_code=500,
            detail="DATABASE_URL is not configured on the server.",
        )

    engine = create_engine(DATABASE_URL, echo=True, future=True)
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