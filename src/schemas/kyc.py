from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class KYCAddress(BaseModel):
    addressLine1: str = Field(min_length=1, max_length=150)
    addressLine2: str = Field(default="", max_length=150)
    barangay: str = Field(default="", max_length=100)
    city: str = Field(min_length=1, max_length=100)
    province: str = Field(min_length=1, max_length=100)
    postalCode: str = Field(min_length=2, max_length=12)
    country: str = Field(min_length=1, max_length=100)


class KYCPersonalDetails(BaseModel):
    firstName: str = Field(min_length=1, max_length=100)
    lastName: str = Field(min_length=1, max_length=100)
    middleName: str = Field(default="", max_length=100)
    contactNumber: str = Field(min_length=7, max_length=30)
    permanentAddress: KYCAddress
    currentAddress: KYCAddress
    organization: str = Field(default="", max_length=100)
    authorized: bool = False


class KYCSubmit(BaseModel):
    legal_name: str = Field(min_length=2, max_length=200)
    date_of_birth: date
    address: str = Field(min_length=5, max_length=1000)
    id_type: str = Field(min_length=2, max_length=80)
    id_number: str = Field(min_length=3, max_length=100)
    personal_details: KYCPersonalDetails | None = None
    defer_review: bool = False

    @field_validator("legal_name", "address", "id_type", "id_number", mode="before")
    @classmethod
    def trim_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class KYCStatus(BaseModel):
    id: int
    legal_name: str
    date_of_birth: date
    address: str
    id_type: str
    personal_details: KYCPersonalDetails | None
    documents: list[str] = Field(default_factory=list)
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
