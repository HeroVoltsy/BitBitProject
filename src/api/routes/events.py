import hashlib
import secrets
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.db.session import DbSession
from src.models.event import Event, EventRegistration, EventStaff
from src.models.qr_ticket import QRTicket
from src.models.user import User
from src.schemas.event import (
    EventCreate,
    EventUpdate,
    EventResponse,
    RegistrationResponse,
    AttendeeResponse,
    StaffInviteCreate,
    StaffResponse,
    StaffDecision,
    TicketResponse,
    CheckInRequest,
    CheckInResponse,
)
from src.services.event_service import (
    get_event_or_404,
    require_event_host,
    require_event_manager,
    ensure_event_is_upcoming,
)


router = APIRouter(prefix="/api/v1/events", tags=["Events"])


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    data: EventCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = Event(
        host_id=current_user.id,
        **data.model_dump(),
    )

    db.add(event)
    await db.commit()
    await db.refresh(event)

    return event


@router.get("", response_model=list[EventResponse])
async def list_events(
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
    category: str | None = None,
    q: str | None = None,
    starts_after: datetime | None = None,
    starts_before: datetime | None = None,
    host_id: int | None = Query(default=None, gt=0),
    mine: bool = False,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = select(Event).where(Event.status == "published")

    if category:
        query = query.where(Event.category == category)

    if q:
        search = f"%{q}%"
        query = query.where(
            or_(
                Event.title.ilike(search),
                Event.location.ilike(search),
            )
        )

    if starts_after:
        query = query.where(Event.starts_at >= starts_after)

    if starts_before:
        query = query.where(Event.starts_at <= starts_before)

    if host_id:
        query = query.where(Event.host_id == host_id)

    if mine:
        query = query.where(Event.host_id == current_user.id)

    query = (
        query
        .order_by(Event.starts_at.asc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    db: DbSession,
):
    event = await get_event_or_404(db, event_id)

    if event.status != "published":
        raise HTTPException(status_code=404, detail="Event not found")

    return event


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    data: EventUpdate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)
    await require_event_host(db, event, current_user)

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)

    return event


@router.delete("/{event_id}")
async def cancel_event(
    event_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)
    await require_event_host(db, event, current_user)

    event.status = "cancelled"

    await db.commit()

    return {
        "message": "Event cancelled successfully",
        "event_id": event.id,
    }


@router.post(
    "/{event_id}/registrations",
    response_model=RegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_attendee(
    event_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)

    if event.status != "published":
        raise HTTPException(
            status_code=409,
            detail="This event is not available for registration",
        )

    if event.host_id == current_user.id:
        raise HTTPException(
            status_code=409,
            detail="The event host cannot RSVP to their own event",
        )

    await ensure_event_is_upcoming(event)

    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.attendee_id == current_user.id,
        )
    )

    registration = result.scalar_one_or_none()

    if registration and registration.status == "registered":
        raise HTTPException(
            status_code=409,
            detail="You are already registered for this event",
        )

    if registration:
        registration.status = "registered"
        registration.joined_at = datetime.now(timezone.utc)
        registration.cancelled_at = None
    else:
        registration = EventRegistration(
            event_id=event_id,
            attendee_id=current_user.id,
            status="registered",
        )
        db.add(registration)

    await db.commit()
    await db.refresh(registration)

    return registration


@router.get(
    "/{event_id}/registrations/me",
    response_model=RegistrationResponse,
)
async def get_my_registration(
    event_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.attendee_id == current_user.id,
            EventRegistration.status == "registered",
        )
    )

    registration = result.scalar_one_or_none()

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="You are not registered for this event",
        )

    return registration


@router.delete("/{event_id}/registrations/me")
async def leave_event(
    event_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.attendee_id == current_user.id,
            EventRegistration.status == "registered",
        )
    )

    registration = result.scalar_one_or_none()

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Active registration not found",
        )

    registration.status = "cancelled"
    registration.cancelled_at = datetime.now(timezone.utc)

    ticket_result = await db.execute(
        select(QRTicket).where(
            QRTicket.event_id == event_id,
            QRTicket.attendee_id == current_user.id,
        )
    )

    ticket = ticket_result.scalar_one_or_none()

    if ticket:
        await db.delete(ticket)

    await db.commit()

    return {
        "message": "You have left the event",
        "event_id": event_id,
    }


@router.get(
    "/{event_id}/attendees",
    response_model=list[AttendeeResponse],
)
async def list_event_attendees(
    event_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)
    await require_event_manager(db, event, current_user)

    result = await db.execute(
        select(EventRegistration, User, QRTicket)
        .join(User, User.id == EventRegistration.attendee_id)
        .outerjoin(
            QRTicket,
            (QRTicket.event_id == EventRegistration.event_id)
            & (QRTicket.attendee_id == EventRegistration.attendee_id),
        )
        .where(
            EventRegistration.event_id == event_id,
            EventRegistration.status == "registered",
        )
        .order_by(EventRegistration.joined_at.asc())
    )

    rows = result.all()

    return [
        AttendeeResponse(
            attendee_id=user.id,
            username=user.username,
            registration_status=registration.status,
            joined_at=registration.joined_at,
            checked_in_at=ticket.checked_in_at if ticket else None,
        )
        for registration, user, ticket in rows
    ]


@router.post(
    "/{event_id}/ticket",
    response_model=TicketResponse,
)
async def issue_my_ticket(
    event_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)

    if event.status != "published":
        raise HTTPException(
            status_code=409,
            detail="Tickets are unavailable for this event",
        )

    registration_result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.attendee_id == current_user.id,
            EventRegistration.status == "registered",
        )
    )

    registration = registration_result.scalar_one_or_none()

    if registration is None:
        raise HTTPException(
            status_code=403,
            detail="You must RSVP before requesting a ticket",
        )

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    ticket_result = await db.execute(
        select(QRTicket).where(
            QRTicket.event_id == event_id,
            QRTicket.attendee_id == current_user.id,
        )
    )

    ticket = ticket_result.scalar_one_or_none()

    if ticket:
        ticket.token_hash = token_hash
        ticket.created_at = datetime.now(timezone.utc)
        ticket.checked_in_at = None
        ticket.checked_in_by = None
    else:
        ticket = QRTicket(
            event_id=event_id,
            attendee_id=current_user.id,
            token_hash=token_hash,
        )
        db.add(ticket)

    await db.commit()

    return TicketResponse(
        event_id=event_id,
        token=token,
        qr_payload=f"BITBIT:TICKET:{event_id}:{token}",
        message="Ticket generated. Keep this QR code private.",
    )


@router.post(
    "/{event_id}/check-ins/scan",
    response_model=CheckInResponse,
)
async def scan_event_ticket(
    event_id: int,
    data: CheckInRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)
    await require_event_manager(db, event, current_user)

    if event.status != "published":
        raise HTTPException(
            status_code=409,
            detail="This event is not active",
        )

    token_hash = hashlib.sha256(data.token.encode()).hexdigest()

    result = await db.execute(
        select(QRTicket)
        .where(
            QRTicket.event_id == event_id,
            QRTicket.token_hash == token_hash,
        )
        .with_for_update()
    )

    ticket = result.scalar_one_or_none()

    if ticket is None:
        raise HTTPException(
            status_code=404,
            detail="Invalid ticket for this event",
        )

    if ticket.checked_in_at is not None:
        raise HTTPException(
            status_code=409,
            detail="This ticket has already been checked in",
        )

    registration_result = await db.execute(
        select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.attendee_id == ticket.attendee_id,
            EventRegistration.status == "registered",
        )
    )

    if registration_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=403,
            detail="This attendee is no longer registered",
        )

    checked_in_at = datetime.now(timezone.utc)

    ticket.checked_in_at = checked_in_at
    ticket.checked_in_by = current_user.id

    await db.commit()

    return CheckInResponse(
        valid=True,
        event_id=event_id,
        attendee_id=ticket.attendee_id,
        checked_in_at=checked_in_at,
        message="Check-in successful",
    )

@router.get(
    "/{event_id}/staff",
    response_model=list[StaffResponse],
)
async def list_event_staff(
    event_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)
    await require_event_host(db, event, current_user)

    result = await db.execute(
        select(EventStaff)
        .where(EventStaff.event_id == event_id)
        .order_by(EventStaff.invited_at.asc())
    )

    return result.scalars().all()


@router.post(
    "/{event_id}/staff",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invite_event_staff(
    event_id: int,
    data: StaffInviteCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)
    await require_event_host(db, event, current_user)

    if data.user_id == event.host_id:
        raise HTTPException(
            status_code=400,
            detail="The event host cannot be invited as staff",
        )

    user_result = await db.execute(
        select(User).where(User.id == data.user_id)
    )

    invited_user = user_result.scalar_one_or_none()

    if invited_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    result = await db.execute(
        select(EventStaff).where(
            EventStaff.event_id == event_id,
            EventStaff.user_id == data.user_id,
        )
    )

    staff = result.scalar_one_or_none()

    if staff:
        if staff.status == "accepted":
            raise HTTPException(
                status_code=409,
                detail="This user is already event staff",
            )

        staff.status = "pending"
        staff.invited_at = datetime.now(timezone.utc)
        staff.accepted_at = None
    else:
        staff = EventStaff(
            event_id=event_id,
            user_id=data.user_id,
            status="pending",
        )
        db.add(staff)

    await db.commit()
    await db.refresh(staff)

    return staff


@router.patch(
    "/{event_id}/staff/me",
    response_model=StaffResponse,
)
async def respond_to_staff_invitation(
    event_id: int,
    data: StaffDecision,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    result = await db.execute(
        select(EventStaff).where(
            EventStaff.event_id == event_id,
            EventStaff.user_id == current_user.id,
        )
    )

    staff = result.scalar_one_or_none()

    if staff is None:
        raise HTTPException(
            status_code=404,
            detail="Staff invitation not found",
        )

    if staff.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="This invitation has already been answered",
        )

    staff.status = data.status

    if data.status == "accepted":
        staff.accepted_at = datetime.now(timezone.utc)
    else:
        staff.accepted_at = None

    await db.commit()
    await db.refresh(staff)

    return staff


@router.delete("/{event_id}/staff/{staff_user_id}")
async def remove_event_staff(
    event_id: int,
    staff_user_id: int,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    event = await get_event_or_404(db, event_id)
    await require_event_host(db, event, current_user)

    result = await db.execute(
        select(EventStaff).where(
            EventStaff.event_id == event_id,
            EventStaff.user_id == staff_user_id,
        )
    )

    staff = result.scalar_one_or_none()

    if staff is None:
        raise HTTPException(
            status_code=404,
            detail="Event staff member not found",
        )

    await db.delete(staff)
    await db.commit()

    return {
        "message": "Event staff member removed",
        "user_id": staff_user_id,
    }
