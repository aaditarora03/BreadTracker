import os
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STRING = os.getenv('CONNECTION_STRING')

# Fail fast with a helpful message if the connection string is missing
if not CONNECTION_STRING:
    raise RuntimeError(
        "CONNECTION_STRING is not set. Create a .env file in server/ or set the environment variable.\n"
        "Example: CONNECTION_STRING=postgresql+asyncpg://user:pass@localhost:54322/dbname"
    )

engine = create_async_engine(
    CONNECTION_STRING,
    connect_args={
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    },
    pool_pre_ping=True,
    echo=True,
)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_session():
    async with AsyncSession(engine) as session:
        yield session