
from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.deps import get_current_user
from src.models.user import User
from src.schemas.auth import UserResponse, UserUpdate
from src.db.session import DbSession


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    data: UserUpdate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    if data.account_type is not None:
        current_user.account_type = data.account_type
    if "discovery_profile" in data.model_fields_set:
        current_user.discovery_profile = data.discovery_profile.model_dump() if data.discovery_profile else None
    await db.commit()
    await db.refresh(current_user)
    return current_user
