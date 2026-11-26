
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from src.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin')", name="ck_users_role"),
        CheckConstraint("account_type IN ('attendee', 'host')", name="ck_users_account_type"),
    )

    # Internal permissions; public signup never accepts this field.
    role: Mapped[str] = mapped_column(
        String(20), default="user", server_default="user", nullable=False,
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    display_name: Mapped[str | None] = mapped_column(String(200))
    account_type: Mapped[str] = mapped_column(String(20), default="attendee", server_default="attendee", nullable=False)
    business_name: Mapped[str | None] = mapped_column(String(100))
    business_contact: Mapped[str | None] = mapped_column(String(200))
    discovery_profile: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
