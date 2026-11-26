
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.db.session import DbSession
from src.models.user import User
from src.services.auth_service import (
    InvalidCredentials,
    get_user_from_token,
)


bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(bearer_scheme),
    ],
    db: DbSession,
) -> User:
    try:
        return await get_user_from_token(
            db,
            credentials.credentials,
        )
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(optional_bearer)],
    db: DbSession,
) -> User | None:
    if credentials is None:
        return None
    try:
        return await get_user_from_token(db, credentials.credentials)
    except InvalidCredentials:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"}) from None
