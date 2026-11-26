from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from src.core.config import get_settings
from src.db.session import DbSession, close_db
from src.api.routes import auth, users, kyc, qr, events

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(kyc.router)
app.include_router(qr.router)
app.include_router(events.router)

@app.get("/")
async def root():
    return {
        "application": settings.APP_NAME,
        "status": "running",
    }


@app.get("/health")
async def health(db: DbSession):
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
        }
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        ) from exc
