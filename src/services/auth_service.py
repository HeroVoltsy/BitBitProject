
import asyncio

import jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from src.models.user import User
from src.schemas.auth import UserRegister


class EmailOrUsernameTaken(Exception):
    pass


class InvalidCredentials(Exception):
    pass


async def register_user(
    db: AsyncSession,
    data: UserRegister,
) -> User:
    email = str(data.email).strip().lower()
    username = data.username.strip()

    # Argon2 is CPU-intensive; don't run it on the event loop.
    hashed_password = await asyncio.to_thread(
        hash_password,
        data.password,
    )

    user = User(
        email=email,
        username=username,
        password_hash=hashed_password,
    )

    try:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
    except IntegrityError as exc:
        await db.rollback()
        raise EmailOrUsernameTaken from exc
    except Exception:
        await db.rollback()
        raise


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> str:
    normalized_email = email.strip().lower()

    result = await db.execute(
        select(User).where(User.email == normalized_email)
    )
    user = result.scalar_one_or_none()

    # Use a generic error so the response doesn't reveal
    # whether a particular email address is registered.
    if user is None:
        raise InvalidCredentials

    password_matches = await asyncio.to_thread(
        verify_password,
        password,
        user.password_hash,
    )

    if not password_matches:
        raise InvalidCredentials

    return create_access_token(str(user.id))


async def get_user_from_token(
    db: AsyncSession,
    token: str,
) -> User:
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")

        if not isinstance(subject, str) or not subject.isdigit():
            raise InvalidCredentials

        user_id = int(subject)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise InvalidCredentials from None

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise InvalidCredentials

    return user
