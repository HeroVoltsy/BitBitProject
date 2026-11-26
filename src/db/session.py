
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.config import get_settings


settings = get_settings()

database_url = make_url(settings.DATABASE_URL)
# Supabase's transaction pooler already owns pooling. Avoid retaining a second
# pool or cached prepared statements across backend transactions.
transaction_pooler = (
    (database_url.host or "").endswith(".pooler.supabase.com")
    and database_url.port == 6543
)
pool_options = {"poolclass": NullPool} if transaction_pooler else {
    "pool_size": settings.DB_POOL_SIZE,
    "max_overflow": settings.DB_MAX_OVERFLOW,
    "pool_timeout": settings.DB_POOL_TIMEOUT,
    "pool_recycle": settings.DB_POOL_RECYCLE,
    "pool_pre_ping": True,
}
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    **pool_options,
    connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0},
)


AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionFactory() as session:
        yield session


DbSession = Annotated[AsyncSession, Depends(get_db)]


async def close_db() -> None:
    await engine.dispose()
