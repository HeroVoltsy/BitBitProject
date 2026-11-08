import hashlib
import secrets
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from src.api.deps import get_current_user
from src.db.session import DbSession
from src.models.qr_ticket import QRTicket
from src.models.user import User
from src.schemas.qr import (
    QRTicketCreate,
    QRTicketResponse,
    QRScanRequest,
    QRScanResponse,
)

router = APIRouter(
    prefix="/api/v1/qr",
    tags=["Event QR Check-in"],
)


@router.post(
    "/tickets",
    response_model=QRTicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event_ticket(
    data: QRTicketCreate,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required",
        )

    result = await db.execute(
        select(QRTicket).where(
            QRTicket.event_id == data.event_id,
            QRTicket.attendee_id == data.attendee_id,
        )
    )

    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="Ticket already exists",
        )

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    ticket = QRTicket(
        event_id=data.event_id,
        attendee_id=data.attendee_id,
        token_hash=token_hash,
    )

    db.add(ticket)
    await db.commit()

    return QRTicketResponse(
        event_id=data.event_id,
        token=token,
        qr_payload=f"BITBIT:TICKET:{data.event_id}:{token}",
        message="Ticket created successfully",
    )


@router.post(
    "/scan",
    response_model=QRScanResponse,
)
async def scan_event_qr(
    data: QRScanRequest,
    db: DbSession,
    current_user: Annotated[User, Depends(get_current_user)],
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required",
        )

    token_hash = hashlib.sha256(
        data.token.encode()
    ).hexdigest()

    result = await db.execute(
        select(QRTicket)
        .where(
            QRTicket.event_id == data.event_id,
            QRTicket.token_hash == token_hash,
        )
        .with_for_update()
    )

    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Invalid event ticket",
        )

    if ticket.checked_in_at is not None:
        raise HTTPException(
            status_code=409,
            detail="Ticket already checked in",
        )

    checked_in_at = datetime.now(timezone.utc)

    ticket.checked_in_at = checked_in_at
    ticket.checked_in_by = current_user.id

    await db.commit()

    return QRScanResponse(
        valid=True,
        event_id=ticket.event_id,
        attendee_id=ticket.attendee_id,
        checked_in_at=checked_in_at,
        message="Check-in successful",
    )
