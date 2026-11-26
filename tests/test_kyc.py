import os
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config
from cryptography.fernet import Fernet
from sqlalchemy import select, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from src.core.config import Settings, get_settings
from src.db.session import get_db
from src.main import app
from src.models.kyc import KYCSubmission
from src.models.user import User
from src.services import kyc_service

PAYLOAD = {
    "legal_name": "KYC Test User",
    "date_of_birth": "2000-01-01",
    "address": "Test Address, Naga City",
    "id_type": "National ID",
    "id_number": "TEST-ID-0001",
}
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000b49444154789c636000020000050001a5f645400000000049454e44ae426082"
)


def test_settings_include_kyc_defaults(monkeypatch):
    monkeypatch.delenv("KYC_ENCRYPTION_KEY", raising=False)
    monkeypatch.delenv("KYC_UPLOAD_DIR", raising=False)
    settings = Settings(
        _env_file=None, DATABASE_URL="postgresql+asyncpg://unused/unused",
        JWT_SECRET_KEY="test-only",
    )
    assert settings.KYC_ENCRYPTION_KEY == ""
    assert settings.KYC_UPLOAD_DIR == "var/kyc"


@pytest.mark.parametrize("key", ["", "not-a-fernet-key"])
def test_unconfigured_encryption_is_handled(monkeypatch, key):
    monkeypatch.setattr(kyc_service, "get_settings", lambda: SimpleNamespace(
        KYC_ENCRYPTION_KEY=key,
    ))
    with pytest.raises(kyc_service.KYCEncryptionNotConfigured):
        kyc_service.encrypt_id_number("TEST-ID-0001")


def test_id_number_encryption_roundtrip(monkeypatch):
    key = Fernet.generate_key().decode("ascii")
    monkeypatch.setattr(kyc_service, "get_settings", lambda: SimpleNamespace(
        KYC_ENCRYPTION_KEY=key,
    ))
    encrypted = kyc_service.encrypt_id_number("  TEST-ID-0001  ")
    assert "TEST-ID-0001" not in encrypted
    assert kyc_service.decrypt_id_number(encrypted) == "TEST-ID-0001"


@pytest_asyncio.fixture
async def api(monkeypatch, tmp_path):
    database_url = os.environ.get("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("Set TEST_DATABASE_URL to run isolated PostgreSQL tests")
    assert make_url(database_url).drivername == "postgresql+asyncpg"
    schema = "kyc_test_" + uuid4().hex
    control = create_async_engine(database_url, poolclass=NullPool)
    engine = create_async_engine(
        database_url, poolclass=NullPool,
        connect_args={"server_settings": {"search_path": schema}},
    )
    previous_overrides = app.dependency_overrides.copy()
    try:
        async with control.begin() as connection:
            await connection.execute(text(f'CREATE SCHEMA "{schema}"'))

        def migrate(connection, revision, downgrade=False):
            config = Config("alembic.ini")
            config.attributes["connection"] = connection
            (command.downgrade if downgrade else command.upgrade)(config, revision)

        async with engine.begin() as connection:
            await connection.run_sync(migrate, "20261108_0004")
            legacy_id = (await connection.execute(text(
                "INSERT INTO users (email, username, password_hash) "
                "VALUES ('legacy@example.com', 'legacy', 'unused') RETURNING id"
            ))).scalar_one()
            await connection.run_sync(migrate, "head")

        sessions = async_sessionmaker(engine, expire_on_commit=False)

        async def override_db():
            async with sessions() as session:
                yield session

        app.dependency_overrides[get_db] = override_db
        monkeypatch.setattr(get_settings(), "KYC_ENCRYPTION_KEY", Fernet.generate_key().decode("ascii"))
        monkeypatch.setattr(get_settings(), "KYC_UPLOAD_DIR", str(tmp_path / "documents"))
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test",
        ) as client:
            yield SimpleNamespace(
                client=client, sessions=sessions, engine=engine,
                legacy_id=legacy_id, migrate=migrate,
            )
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)
        await engine.dispose()
        async with control.begin() as connection:
            await connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
        await control.dispose()


async def account(api, name="joiner", admin=False, **extra):
    data = {
        "email": f"{name}@example.com", "username": name,
        "password": "LocalTestOnly_12345", **extra,
    }
    registered = await api.client.post("/auth/register", json=data)
    assert registered.status_code == 201
    user_id = registered.json()["id"]
    if admin:
        async with api.sessions() as db:
            user = await db.get(User, user_id)
            user.role = "admin"
            await db.commit()
    login = await api.client.post("/auth/login", json={
        "email": data["email"], "password": data["password"],
    })
    assert login.status_code == 200
    return user_id, {"Authorization": "Bearer " + login.json()["access_token"]}


@pytest.mark.asyncio
async def test_migration_backfills_and_downgrades(api):
    async with api.sessions() as db:
        legacy = await db.get(User, api.legacy_id)
        assert legacy.role == "user"
        with pytest.raises(IntegrityError):
            await db.execute(text("UPDATE users SET role = 'owner' WHERE id = :id"), {"id": legacy.id})
        await db.rollback()
    async with api.engine.begin() as connection:
        await connection.run_sync(api.migrate, "20261108_0004", True)
        columns = (await connection.execute(text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = current_schema() AND table_name = 'users'"
        ))).scalars().all()
        assert "role" not in columns
        assert (await connection.execute(text("SELECT count(*) FROM users"))).scalar_one() == 1
        await connection.run_sync(api.migrate, "head")


@pytest.mark.asyncio
async def test_public_signup_cannot_grant_admin(api):
    user_id, headers = await account(api, role="admin")
    async with api.sessions() as db:
        assert (await db.get(User, user_id)).role == "user"
    me = await api.client.get("/users/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["id"] == user_id
    for method, url, body in [
        ("GET", f"/api/v1/kyc/admin/{user_id}", None),
        ("PATCH", f"/api/v1/kyc/admin/{user_id}/review", {"status": "approved"}),
        ("GET", f"/api/v1/kyc/admin/{user_id}/documents/front", None),
        ("POST", "/api/v1/qr/tickets", {"event_id": 1, "attendee_id": user_id}),
        ("POST", "/api/v1/qr/scan", {"event_id": 1, "token": "test-token-value-long-enough"}),
    ]:
        response = await api.client.request(method, url, headers=headers, json=body)
        assert response.status_code == 403


@pytest.mark.asyncio
@pytest.mark.parametrize("key", ["", "invalid"])
async def test_missing_or_invalid_key_returns_503(api, monkeypatch, key):
    _, headers = await account(api)
    monkeypatch.setattr(get_settings(), "KYC_ENCRYPTION_KEY", key)
    response = await api.client.post("/api/v1/kyc/submit", headers=headers, json=PAYLOAD)
    assert response.status_code == 503
    assert response.json()["detail"] == "KYC encryption is not configured"
    assert (await api.client.get("/api/v1/kyc/me", headers=headers)).status_code == 404


@pytest.mark.asyncio
async def test_submission_upload_and_admin_review(api):
    user_id, headers = await account(api)
    _, other_headers = await account(api, "other")
    admin_id, admin_headers = await account(api, "reviewer", admin=True)
    assert (await api.client.post("/api/v1/kyc/submit", json=PAYLOAD)).status_code == 401
    submitted = await api.client.post("/api/v1/kyc/submit", headers=headers, json=PAYLOAD)
    assert submitted.status_code == 201
    assert submitted.json()["status"] == "pending"
    assert "id_number" not in submitted.json()
    async with api.sessions() as db:
        saved = (await db.execute(select(KYCSubmission).where(KYCSubmission.user_id == user_id))).scalar_one()
        assert saved.id_number_encrypted != PAYLOAD["id_number"]
        assert kyc_service.decrypt_id_number(saved.id_number_encrypted) == PAYLOAD["id_number"]
    assert (await api.client.get("/api/v1/kyc/me", headers=other_headers)).status_code == 404
    assert (await api.client.post("/api/v1/kyc/submit", headers=headers, json=PAYLOAD)).status_code == 409
    for kind in ("front", "back", "selfie"):
        uploaded = await api.client.post(
            f"/api/v1/kyc/documents/{kind}", headers=headers,
            files={"file": ("test.png", PNG, "image/png")},
        )
        assert uploaded.status_code == 200
        document = await api.client.get(
            f"/api/v1/kyc/admin/{user_id}/documents/{kind}", headers=admin_headers,
        )
        assert document.status_code == 200
        assert document.content == PNG
    rejected_upload = await api.client.post(
        "/api/v1/kyc/documents/front", headers=headers,
        files={"file": ("fake.png", b"not an image", "image/png")},
    )
    assert rejected_upload.status_code == 415
    review = await api.client.patch(
        f"/api/v1/kyc/admin/{user_id}/review", headers=admin_headers,
        json={"status": "approved", "review_note": "Checked test documents"},
    )
    assert review.status_code == 200
    assert review.json()["status"] == "approved"
    assert review.json()["reviewed_at"] is not None
    mine = await api.client.get("/api/v1/kyc/me", headers=headers)
    assert mine.json()["status"] == "approved"
    async with api.sessions() as db:
        saved = (await db.execute(select(KYCSubmission).where(KYCSubmission.user_id == user_id))).scalar_one()
        assert saved.reviewed_by == admin_id
    assert (await api.client.post(
        "/api/v1/kyc/documents/front", headers=headers,
        files={"file": ("test.png", PNG, "image/png")},
    )).status_code == 409


@pytest.mark.asyncio
async def test_rejected_submission_can_be_resubmitted(api):
    user_id, headers = await account(api)
    _, admin_headers = await account(api, "reviewer", admin=True)
    assert (await api.client.post("/api/v1/kyc/submit", headers=headers, json=PAYLOAD)).status_code == 201
    assert (await api.client.post(
        "/api/v1/kyc/documents/front", headers=headers,
        files={"file": ("test.png", PNG, "image/png")},
    )).status_code == 200
    async with api.sessions() as db:
        saved = (await db.execute(select(KYCSubmission).where(KYCSubmission.user_id == user_id))).scalar_one()
        old_file = Path(saved.document_front_path)
    assert (await api.client.patch(
        f"/api/v1/kyc/admin/{user_id}/review", headers=admin_headers,
        json={"status": "resubmission_required", "review_note": "Replace test photo"},
    )).status_code == 200
    response = await api.client.post("/api/v1/kyc/submit", headers=headers, json=PAYLOAD)
    assert response.status_code == 201
    assert response.json()["status"] == "pending"
    assert response.json()["review_note"] is None
    assert response.json()["reviewed_at"] is None
    assert not old_file.exists()
