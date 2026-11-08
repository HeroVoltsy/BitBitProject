
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class QRTicket(Base):
    __tablename__ = "qr_tickets"

    __table_args__ = (
        UniqueConstraint(
            "event_id",
            "attendee_id",
            name="uq_qr_ticket_event_attendee",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    event_id: Mapped[int] = mapped_column(
        Integer,
        index=True,
        nullable=False,
    )

    attendee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    checked_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    checked_in_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id")
    )
