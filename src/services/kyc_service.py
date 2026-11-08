from cryptography.fernet import Fernet, InvalidToken

from src.core.config import get_settings


class KYCEncryptionNotConfigured(Exception):
    pass


def _fernet() -> Fernet:
    key = get_settings().KYC_ENCRYPTION_KEY

    if not key:
        raise KYCEncryptionNotConfigured

    try:
        return Fernet(key.encode("utf-8"))
    except (TypeError, ValueError):
        raise KYCEncryptionNotConfigured from None


def encrypt_id_number(value: str) -> str:
    return _fernet().encrypt(
        value.strip().encode("utf-8")
    ).decode("ascii")


def decrypt_id_number(value: str) -> str:
    try:
        return _fernet().decrypt(
            value.encode("ascii")
        ).decode("utf-8")
    except (InvalidToken, ValueError):
        raise KYCEncryptionNotConfigured from None
