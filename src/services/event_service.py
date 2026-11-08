from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.event import Event, EventStaff
from src.models.user import User


async def get_event_or_404(
    db: AsyncSession,
    event_id: int,
) -> Event:
    result = await db.execute(
        select(Event).where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return event


async def require_event_host(
    db: AsyncSession,
    event: Event,
    user: User,
) -> None:
    if event.host_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the event host can perform this action",
        )


async def require_event_manager(
    db: AsyncSession,
    event: Event,
    user: User,
) -> None:
    if event.host_id == user.id:
        return

    result = await db.execute(
        select(EventStaff).where(
            EventStaff.event_id == event.id,
            EventStaff.user_id == user.id,
            EventStaff.status == "accepted",
        )
    )

    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to manage this event",
        )


async def ensure_event_is_upcoming(event: Event) -> None:
    now = datetime.now(timezone.utc)

    if event.starts_at <= now:
        raise HTTPException(
            status_code=409,
            detail="This event has already started",
        )
