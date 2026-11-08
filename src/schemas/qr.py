from datetime import datetime

from pydantic import BaseModel, Field


class QRTicketCreate(BaseModel):
    event_id: int = Field(gt=0)
    attendee_id: int = Field(gt=0)


class QRTicketResponse(BaseModel):
    event_id: int
    token: str
    qr_payload: str
    message: str


class QRScanRequest(BaseModel):
    event_id: int = Field(gt=0)
    token: str = Field(min_length=20, max_length=300)


class QRScanResponse(BaseModel):
    valid: bool
    event_id: int
    attendee_id: int
    checked_in_at: datetime
    message: str
