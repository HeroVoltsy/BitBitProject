from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def private_api_cache_headers(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith(("/auth/", "/users/", "/api/v1/kyc", "/api/v1/events")):
        response.headers["Cache-Control"] = "no-store"
    return response


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
    except (SQLAlchemyError, OSError, TimeoutError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable",
        ) from exc
