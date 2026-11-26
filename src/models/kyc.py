
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class KYCSubmission(Base):
    __tablename__ = "kyc_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    legal_name: Mapped[str] = mapped_column(String(200), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    id_type: Mapped[str] = mapped_column(String(80), nullable=False)
    id_number_encrypted: Mapped[str] = mapped_column(Text, nullable=False)

    document_front_path: Mapped[str | None] = mapped_column(String(500))
    document_back_path: Mapped[str | None] = mapped_column(String(500))
    selfie_path: Mapped[str | None] = mapped_column(String(500))

    status: Mapped[str] = mapped_column(
        String(30),
        default="pending",
        server_default="pending",
        index=True,
    )

    review_note: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
