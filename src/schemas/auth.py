from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

AccountType = Literal["attendee", "host"]
Occupation = Literal["student", "teacher", "professional", "business_owner", "self_employed", "other", "prefer_not_to_say"]
Interest = Literal["Market", "Music", "Sports", "Volunteer", "Fun Run", "Concert", "Pop-Up"]


class DiscoveryProfile(BaseModel):
    occupation: Occupation
    interests: list[Interest] = Field(min_length=1, max_length=7)


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(min_length=12, max_length=128)
    display_name: str | None = Field(default=None, min_length=2, max_length=200)
    account_type: AccountType = "attendee"
    business_name: str | None = Field(default=None, max_length=100)
    business_contact: str | None = Field(default=None, max_length=200)

    @model_validator(mode="after")
    def validate_host(self):
        if self.account_type == "host" and len((self.business_name or "").strip()) < 2:
            raise ValueError("Enter your business or organizer name")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    display_name: str | None
    account_type: AccountType
    business_name: str | None
    business_contact: str | None
    discovery_profile: DiscoveryProfile | None
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    # Only editable profile fields; never internal permissions or credentials.
    account_type: AccountType | None = None
    discovery_profile: DiscoveryProfile | None = None
    model_config = ConfigDict(extra="forbid")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
