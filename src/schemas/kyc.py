from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class KYCSubmit(BaseModel):
    legal_name: str = Field(min_length=2, max_length=200)
    date_of_birth: date
    address: str = Field(min_length=5, max_length=1000)
    id_type: str = Field(min_length=2, max_length=80)
    id_number: str = Field(min_length=3, max_length=100)


class KYCStatus(BaseModel):
    id: int
    legal_name: str
    date_of_birth: date
    address: str
    id_type: str
    status: str
    review_note: str | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KYCReview(BaseModel):
    status: Literal[
        "approved",
        "rejected",
        "resubmission_required",
    ]
    review_note: str | None = Field(default=None, max_length=2000)
