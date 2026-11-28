from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, JSON, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db.base import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name: Mapped[str | None] = mapped_column(String(100))
    bio: Mapped[str | None] = mapped_column(Text)
    website_url: Mapped[str | None] = mapped_column(String(500))
    social_links: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    occupation: Mapped[str | None] = mapped_column(String(40))
    interests: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class HostProfile(Base):
    __tablename__ = "host_profiles"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    business_name: Mapped[str | None] = mapped_column(String(150))
    business_contact: Mapped[str | None] = mapped_column(String(200))
    business_description: Mapped[str | None] = mapped_column(Text)
    business_website: Mapped[str | None] = mapped_column(String(500))
    business_address: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class LikedEvent(Base):
    __tablename__ = "liked_events"
    __table_args__ = (UniqueConstraint("user_id", "event_id", name="uq_liked_event_user_event"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
