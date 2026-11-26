import json

import httpx
import pytest
from cryptography.fernet import Fernet
from sqlalchemy import select, text

from tests.test_kyc import api, account, PAYLOAD, PNG  # noqa: F401
from src.api.deps import get_current_user
from src.core.config import get_settings
from src.db.session import get_db
from src.main import app
from src.models.kyc import KYCSubmission, KYCDocument
from src.models.user import User

ADDRESS = {
    "addressLine1": "1 Test Street", "addressLine2": "", "barangay": "Test District",
    "city": "Naga City", "province": "Camarines Sur", "postalCode": "4400", "country": "Philippines",
}
PERSONAL = {
    "firstName": "Alex", "lastName": "Sample", "middleName": "", "contactNumber": "09123456789",
    "permanentAddress": ADDRESS, "currentAddress": {**ADDRESS, "addressLine1": "2 Current Street"},
    "organization": "Sample Club", "authorized": True,
}


@pytest.mark.asyncio
async def test_host_profile_survives_fresh_login_and_preferences_are_saved(api):
    user_id, headers = await account(api, "hostperson", account_type="host", display_name="Host Person",
        business_name="Local Club", business_contact="Test contact", role="admin")
    response = await api.client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    user = response.json()
    assert user["account_type"] == "host"
    assert user["display_name"] == "Host Person"
    assert user["business_name"] == "Local Club"
    assert "password_hash" not in user and "role" not in user
    profile = {"occupation": "teacher", "interests": ["Music", "Sports"]}
    updated = await api.client.patch("/users/me", headers=headers, json={"discovery_profile": profile, "account_type": "attendee"})
    assert updated.status_code == 200
    login = await api.client.post("/auth/login", json={"email": "hostperson@example.com", "password": "LocalTestOnly_12345"})
    new_headers = {"Authorization": "Bearer " + login.json()["access_token"]}
    reread = (await api.client.get("/users/me", headers=new_headers)).json()
    assert reread["discovery_profile"] == profile
    assert reread["account_type"] == "attendee"
    assert reread["business_name"] == "Local Club"
    denied = await api.client.patch("/users/me", headers=headers, json={"role": "admin"})
    assert denied.status_code == 422
    async with api.sessions() as db:
        assert (await db.get(User, user_id)).role == "user"


@pytest.mark.asyncio
async def test_bad_registration_and_login_do_not_create_a_session(api):
    bad = {"email": "bad@example.com", "username": "bad", "password": "short"}
    assert (await api.client.post("/auth/register", json=bad)).status_code == 422
    assert (await api.client.post("/auth/register", json={**bad, "password": "LongEnough_1234", "account_type": "host"})).status_code == 422
    _, headers = await account(api)
    wrong = await api.client.post("/auth/login", json={"email": "joiner@example.com", "password": "wrong-password"})
    assert wrong.status_code == 401 and "access_token" not in wrong.json()
    assert (await api.client.get("/users/me", headers={"Authorization": "Bearer invalid"})).status_code == 401
    assert (await api.client.get("/api/v1/kyc/me", headers=headers)).status_code == 404


@pytest.mark.asyncio
async def test_kyc_draft_complete_and_encrypted_database_documents(api):
    user_id, headers = await account(api)
    _, other_headers = await account(api, "other")
    _, admin_headers = await account(api, "reviewer", admin=True)
    submitted = await api.client.post("/api/v1/kyc/submit", headers=headers,
        json={**PAYLOAD, "defer_review": True, "personal_details": PERSONAL})
    assert submitted.status_code == 201
    draft = submitted.json()
    assert draft["status"] == "draft" and draft["documents"] == []
    assert draft["personal_details"] == PERSONAL
    assert (await api.client.post("/api/v1/kyc/complete", headers=headers)).status_code == 422
    assert (await api.client.patch(f"/api/v1/kyc/admin/{user_id}/review", headers=admin_headers,
        json={"status": "approved"})).status_code == 409
    for kind in ["front", "back", "selfie"]:
        response = await api.client.post(f"/api/v1/kyc/documents/{kind}", headers=headers,
            files={"file": ("sample.png", PNG, "image/png")})
        assert response.status_code == 200
    # Files persist as encrypted database bytes, never publicly addressable objects.
    async with api.sessions() as db:
        document = (await db.execute(select(KYCDocument).where(
            KYCDocument.submission_id == draft["id"], KYCDocument.kind == "front"))).scalar_one()
        assert document.encrypted_content != PNG
        assert Fernet(get_settings().KYC_ENCRYPTION_KEY.encode()).decrypt(document.encrypted_content) == PNG
    assert (await api.client.get(f"/api/v1/kyc/admin/{user_id}/documents/front", headers=other_headers)).status_code == 403
    downloaded = await api.client.get(f"/api/v1/kyc/admin/{user_id}/documents/front", headers=admin_headers)
    assert downloaded.content == PNG
    assert downloaded.headers["cache-control"] == "no-store"
    assert (await api.client.post("/api/v1/kyc/complete", headers=headers)).json()["status"] == "pending"
    assert (await api.client.post("/api/v1/kyc/complete", headers=headers)).status_code == 200
    saved = (await api.client.get("/api/v1/kyc/me", headers=headers)).json()
    assert sorted(saved["documents"]) == ["back", "front", "selfie"]
    assert "id_number" not in saved and "encrypted_content" not in saved
    assert (await api.client.post("/api/v1/kyc/submit", headers=headers, json=PAYLOAD)).status_code == 409
    review = await api.client.patch(f"/api/v1/kyc/admin/{user_id}/review", headers=admin_headers,
        json={"status": "resubmission_required", "review_note": "Choose a clearer front photo"})
    assert review.status_code == 200
    retry = await api.client.post("/api/v1/kyc/submit", headers=headers,
        json={**PAYLOAD, "defer_review": True, "personal_details": PERSONAL})
    assert retry.json()["status"] == "draft" and retry.json()["documents"] == []
    async with api.sessions() as db:
        assert (await db.execute(select(KYCDocument).where(KYCDocument.submission_id == draft["id"]))).scalars().all() == []


@pytest.mark.asyncio
async def test_passport_needs_no_back_and_failed_upload_stays_draft(api):
    _, headers = await account(api)
    await api.client.post("/api/v1/kyc/submit", headers=headers, json={**PAYLOAD, "id_type": "Passport", "defer_review": True})
    invalid = await api.client.post("/api/v1/kyc/documents/front", headers=headers,
        files={"file": ("fake.png", b"not-png", "image/png")})
    assert invalid.status_code == 415
    assert (await api.client.get("/api/v1/kyc/me", headers=headers)).json()["status"] == "draft"
    oversized = await api.client.post("/api/v1/kyc/documents/front", headers=headers,
        files={"file": ("large.png", b"x" * (4 * 1024 * 1024 + 1), "image/png")})
    assert oversized.status_code == 413
    for kind in ["front", "selfie"]:
        assert (await api.client.post(f"/api/v1/kyc/documents/{kind}", headers=headers,
            files={"file": ("sample.png", PNG, "image/png")})).status_code == 200
    assert (await api.client.post("/api/v1/kyc/complete", headers=headers)).json()["status"] == "pending"


@pytest.mark.asyncio
async def test_integration_migration_downgrade_preserves_legacy_accounts(api):
    async with api.engine.begin() as connection:
        await connection.run_sync(api.migrate, "20261110_0005", True)
        assert (await connection.execute(text("SELECT count(*) FROM users"))).scalar_one() == 1
        await connection.run_sync(api.migrate, "head")
    async with api.sessions() as db:
        legacy = await db.get(User, api.legacy_id)
        assert legacy.account_type == "attendee" and legacy.display_name is None


@pytest.mark.asyncio
async def test_cors_allows_only_configured_frontend_origin():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        headers = {"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type"}
        allowed = await client.options("/auth/login", headers=headers)
        assert allowed.status_code == 200
        assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"
        blocked = await client.options("/auth/login", headers={**headers, "Origin": "https://untrusted.example"})
        assert blocked.status_code == 400 and "access-control-allow-origin" not in blocked.headers


@pytest.mark.asyncio
async def test_health_connection_refused_is_service_unavailable():
    class Unavailable:
        async def execute(self, query):
            raise ConnectionRefusedError("private connection details")
    async def override():
        yield Unavailable()
    app.dependency_overrides[get_db] = override
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/health")
            assert response.status_code == 503
            assert response.json() == {"detail": "Database unavailable"}
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_blank_id_and_incomplete_review_are_rejected(api):
    user_id, headers = await account(api)
    _, admin_headers = await account(api, "reviewer", admin=True)
    response = await api.client.post("/api/v1/kyc/submit", headers=headers, json={**PAYLOAD, "id_number": "   "})
    assert response.status_code == 422
    assert (await api.client.post("/api/v1/kyc/submit", headers=headers, json=PAYLOAD)).status_code == 201
    assert (await api.client.patch(f"/api/v1/kyc/admin/{user_id}/review", headers=admin_headers,
        json={"status": "approved"})).status_code == 422
