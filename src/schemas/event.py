from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator


class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    category: str = Field(min_length=2, max_length=40)
    starts_at: datetime
    location: str = Field(min_length=2, max_length=300)
    description: str | None = None
    promoted: bool = False
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    cover_image_url: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_event(self):
        if self.starts_at.tzinfo is None:
            raise ValueError("starts_at must include a timezone")

        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")

        return self


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=180)
    category: str | None = Field(default=None, min_length=2, max_length=40)
    starts_at: datetime | None = None
    location: str | None = Field(default=None, min_length=2, max_length=300)
    description: str | None = None
    promoted: bool | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    cover_image_url: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_event(self):
        if self.starts_at is not None and self.starts_at.tzinfo is None:
            raise ValueError("starts_at must include a timezone")

        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")

        return self


class EventResponse(BaseModel):
    id: int
    host_id: int
    title: str
    category: str
    starts_at: datetime
    location: str
    description: str | None
    promoted: bool
    latitude: float | None
    longitude: float | None
    cover_image_url: str | None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RegistrationResponse(BaseModel):
    id: int
    event_id: int
    attendee_id: int
    status: str
    joined_at: datetime
    cancelled_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class AttendeeResponse(BaseModel):
    attendee_id: int
    username: str
    registration_status: str
    joined_at: datetime
    checked_in_at: datetime | None


class StaffInviteCreate(BaseModel):
    user_id: int = Field(gt=0)


class StaffResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    status: str
    invited_at: datetime
    accepted_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class StaffDecision(BaseModel):
    status: str

    @model_validator(mode="after")
    def validate_status(self):
        if self.status not in {"accepted", "declined"}:
            raise ValueError("status must be accepted or declined")
        return self


class TicketResponse(BaseModel):
    event_id: int
    token: str
    qr_payload: str
    message: str


class CheckInRequest(BaseModel):
    token: str = Field(min_length=20, max_length=300)


class CheckInResponse(BaseModel):
    valid: bool
    event_id: int
    attendee_id: int
    checked_in_at: datetime
    message: str
