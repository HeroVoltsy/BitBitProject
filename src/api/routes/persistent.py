from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from src.api.deps import get_current_user
from src.db.session import DbSession
from src.models.user import User
from src.models.event import Event
from src.models.persistent import UserProfile, HostProfile, LikedEvent
from src.schemas.persistent import (
    UserProfileUpdate, UserProfileResponse, HostProfileUpdate,
    HostProfileResponse, LikedEventResponse,
)

router = APIRouter(prefix="/api/v1/me", tags=["User data"])


async def get_or_create_profile(db, user_id: int) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user_id, social_links={}, interests=[])
        db.add(profile)
        await db.flush()
    return profile


async def get_or_create_host_profile(db, user_id: int) -> HostProfile:
    result = await db.execute(select(HostProfile).where(HostProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = HostProfile(user_id=user_id)
        db.add(profile)
        await db.flush()
    return profile


@router.get("/profile", response_model=UserProfileResponse)
async def read_profile(db: DbSession, current_user: Annotated[User, Depends(get_current_user)]):
    profile = await get_or_create_profile(db, current_user.id)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.patch("/profile", response_model=UserProfileResponse)
async def update_profile(data: UserProfileUpdate, db: DbSession, current_user: Annotated[User, Depends(get_current_user)]):
    profile = await get_or_create_profile(db, current_user.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/host-profile", response_model=HostProfileResponse)
async def read_host_profile(db: DbSession, current_user: Annotated[User, Depends(get_current_user)]):
    profile = await get_or_create_host_profile(db, current_user.id)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.patch("/host-profile", response_model=HostProfileResponse)
async def update_host_profile(data: HostProfileUpdate, db: DbSession, current_user: Annotated[User, Depends(get_current_user)]):
    profile = await get_or_create_host_profile(db, current_user.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/liked-events", response_model=list[LikedEventResponse])
async def list_liked_events(db: DbSession, current_user: Annotated[User, Depends(get_current_user)]):
    result = await db.execute(
        select(LikedEvent, Event)
        .join(Event, Event.id == LikedEvent.event_id)
        .where(LikedEvent.user_id == current_user.id, Event.status == "published")
        .order_by(desc(LikedEvent.created_at))
    )
    return [{"event": event, "liked_at": liked.created_at} for liked, event in result.all()]


@router.put("/liked-events/{event_id}", status_code=status.HTTP_201_CREATED)
async def like_event(event_id: int, db: DbSession, current_user: Annotated[User, Depends(get_current_user)]):
    event_result = await db.execute(select(Event).where(Event.id == event_id, Event.status == "published"))
    if event_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Event not found")
    result = await db.execute(select(LikedEvent).where(LikedEvent.user_id == current_user.id, LikedEvent.event_id == event_id))
    if result.scalar_one_or_none() is None:
        db.add(LikedEvent(user_id=current_user.id, event_id=event_id))
        await db.commit()
    return {"liked": True, "event_id": event_id}


@router.delete("/liked-events/{event_id}")
async def unlike_event(event_id: int, db: DbSession, current_user: Annotated[User, Depends(get_current_user)]):
    result = await db.execute(select(LikedEvent).where(LikedEvent.user_id == current_user.id, LikedEvent.event_id == event_id))
    liked = result.scalar_one_or_none()
    if liked is not None:
        await db.delete(liked)
        await db.commit()
    return {"liked": False, "event_id": event_id}
