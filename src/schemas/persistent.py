from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator
from src.schemas.event import EventResponse

OCCUPATIONS = {"student", "teacher", "professional", "business_owner", "self_employed", "other", "prefer_not_to_say"}
INTERESTS = {"Market", "Music", "Sports", "Volunteer", "Fun Run", "Concert", "Pop-Up"}


class UserProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=100)
    bio: str | None = Field(default=None, max_length=2000)
    website_url: str | None = Field(default=None, max_length=500)
    social_links: dict[str, str] | None = None
    occupation: str | None = None
    interests: list[str] | None = None

    @field_validator("occupation")
    @classmethod
    def valid_occupation(cls, value):
        if value is not None and value not in OCCUPATIONS:
            raise ValueError("Unsupported occupation")
        return value

    @field_validator("interests")
    @classmethod
    def valid_interests(cls, value):
        if value is not None and (len(value) != len(set(value)) or any(v not in INTERESTS for v in value)):
            raise ValueError("One or more interests are unsupported")
        return value


class UserProfileResponse(BaseModel):
    user_id: int
    display_name: str | None
    bio: str | None
    website_url: str | None
    social_links: dict[str, str]
    occupation: str | None
    interests: list[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class HostProfileUpdate(BaseModel):
    business_name: str | None = Field(default=None, max_length=150)
    business_contact: str | None = Field(default=None, max_length=200)
    business_description: str | None = Field(default=None, max_length=3000)
    business_website: str | None = Field(default=None, max_length=500)
    business_address: str | None = Field(default=None, max_length=300)


class HostProfileResponse(BaseModel):
    user_id: int
    business_name: str | None
    business_contact: str | None
    business_description: str | None
    business_website: str | None
    business_address: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class LikedEventResponse(BaseModel):
    event: EventResponse
    liked_at: datetime
