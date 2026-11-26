import asyncio
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from tests.test_kyc import api, account  # noqa: F401
from src.models.event import Event


def payload(**overrides):
    start = datetime.now(timezone.utc) + timedelta(days=1)
    return {"title": "Community Music Night", "category": "Music", "starts_at": start.isoformat(),
        "ends_at": (start + timedelta(hours=4)).isoformat(), "location": "Test Community Hall",
        "description": "A local event", "audiences": ["student"], **overrides}


async def host_event(api, name="host"):
    uid, headers = await account(api, name, account_type="host", business_name="Test Club")
    response = await api.client.post("/api/v1/events", headers=headers, json=payload())
    assert response.status_code == 201, response.text
    return uid, headers, response.json()["id"]


@pytest.mark.asyncio
async def test_public_feed_real_counts_registration_and_saved_events(api):
    host, hh, eid = await host_event(api)
    _, joiner = await account(api, "attendee")
    _, stranger = await account(api, "stranger")
    feed = await api.client.get("/api/v1/events")
    assert feed.status_code == 200
    assert feed.headers["cache-control"] == "no-store"
    event = feed.json()[0]
    assert event["going"] == 0 and not event["registered"] and event["host_name"] == "Test Club"
    assert event["audiences"] == ["student"]
    assert (await api.client.post("/api/v1/events", headers=joiner, json=payload())).status_code == 403
    assert (await api.client.post(f"/api/v1/events/{eid}/registrations", headers=hh)).status_code == 409
    assert (await api.client.post(f"/api/v1/events/{eid}/registrations", headers=joiner)).status_code == 201
    event = (await api.client.get(f"/api/v1/events/{eid}", headers=joiner)).json()
    assert event["registered"] and event["going"] == 1
    assert not (await api.client.get(f"/api/v1/events/{eid}", headers=stranger)).json()["registered"]
    assert len((await api.client.get("/api/v1/events/mine/registrations", headers=joiner)).json()) == 1
    assert (await api.client.get("/api/v1/events/mine/registrations", headers=stranger)).json() == []
    for _ in range(2): assert (await api.client.post(f"/api/v1/events/{eid}/likes", headers=joiner)).status_code == 200
    assert (await api.client.get("/api/v1/events/mine/likes", headers=joiner)).json()[0]["liked"]
    assert (await api.client.get("/api/v1/events/mine/likes", headers=stranger)).json() == []
    assert (await api.client.delete(f"/api/v1/events/{eid}/likes", headers=joiner)).status_code == 200
    assert (await api.client.get("/api/v1/events/mine/likes", headers=joiner)).json() == []


@pytest.mark.asyncio
async def test_staff_invitation_checkin_and_revocation_permissions(api):
    _, host, eid = await host_event(api)
    staff_id, staff = await account(api, "staff")
    _, joiner = await account(api, "attendee")
    _, outsider = await account(api, "outsider")
    base = f"/api/v1/events/{eid}"
    assert (await api.client.post(base+"/registrations", headers=joiner)).status_code == 201
    ticket = (await api.client.post(base+"/ticket", headers=joiner)).json()
    invited = await api.client.post(base+"/staff", headers=host, json={"email":"staff@example.com"})
    assert invited.status_code == 201 and invited.json()["user_id"] == staff_id
    assert (await api.client.get(base+"/staff", headers=host)).json()[0]["email"] == "staff@example.com"
    assert (await api.client.get(base+"/check-ins/summary", headers=staff)).status_code == 403
    assert (await api.client.post(base+"/check-ins/scan", headers=staff,json={"token":ticket["token"]})).status_code == 403
    response = await api.client.get("/api/v1/events/mine/staff", headers=staff)
    assert response.status_code == 200, response.text
    mine = response.json()
    assert mine[0]["event"]["id"] == eid and mine[0]["status"] == "pending"
    assert (await api.client.patch(base+"/staff/me", headers=staff,json={"status":"accepted"})).status_code == 200
    assert (await api.client.get(base+"/attendees", headers=staff)).status_code == 403
    assert (await api.client.get(base+"/staff", headers=staff)).status_code == 403
    assert (await api.client.get(base+"/check-ins/summary", headers=outsider)).status_code == 403
    assert (await api.client.post(base+"/check-ins/scan", headers=staff,json={"token":ticket["token"]})).status_code == 200
    assert (await api.client.get(base+"/check-ins/summary", headers=staff)).json() == {"registered":1,"checked_in":1}
    assert (await api.client.post(base+"/check-ins/scan", headers=staff,json={"token":ticket["token"]})).status_code == 409
    # Issuing another QR must never erase an existing check-in.
    assert (await api.client.post(base+"/ticket", headers=joiner)).status_code == 409
    assert (await api.client.get(base+"/attendees", headers=host)).json()[0]["checked_in_at"] is not None
    assert (await api.client.delete(base+f"/staff/{staff_id}",headers=outsider)).status_code == 403
    assert (await api.client.delete(base+f"/staff/{staff_id}",headers=host)).status_code == 200
    assert (await api.client.get(base+"/check-ins/summary",headers=staff)).status_code == 403
    assert (await api.client.get("/api/v1/events/mine/staff",headers=staff)).json() == []


@pytest.mark.asyncio
async def test_leaving_invalidates_ticket_and_cancelled_event_cannot_be_joined(api):
    _, host, eid = await host_event(api)
    _, joiner = await account(api, "attendee")
    base = f"/api/v1/events/{eid}"
    await api.client.post(base+"/registrations",headers=joiner)
    ticket = (await api.client.post(base+"/ticket",headers=joiner)).json()
    assert (await api.client.delete(base+"/registrations/me",headers=joiner)).status_code == 200
    assert (await api.client.post(base+"/ticket",headers=joiner)).status_code == 403
    assert (await api.client.post(base+"/check-ins/scan",headers=host,json={"token":ticket["token"]})).status_code == 404
    await api.client.post(base+"/registrations",headers=joiner)
    fresh = (await api.client.post(base+"/ticket",headers=joiner)).json()
    assert fresh["token"] != ticket["token"]
    assert (await api.client.delete(base,headers=joiner)).status_code == 403
    assert (await api.client.delete(base,headers=host)).status_code == 200
    assert (await api.client.get(base)).status_code == 404
    assert (await api.client.get("/api/v1/events")).json() == []
    assert (await api.client.post(base+"/registrations",headers=joiner)).status_code == 409
    assert (await api.client.post(base+"/check-ins/scan",headers=host,json={"token":fresh["token"]})).status_code == 409


@pytest.mark.asyncio
async def test_invalid_event_times_expired_staff_and_cross_event_ticket(api):
    _, host, eid = await host_event(api)
    _, staff = await account(api,"staff")
    _, joiner = await account(api,"attendee")
    past = datetime.now(timezone.utc)-timedelta(days=2)
    assert (await api.client.post("/api/v1/events",headers=host,json=payload(starts_at=past.isoformat()))).status_code == 422
    assert (await api.client.patch(f"/api/v1/events/{eid}",headers=host,json={"ends_at":past.isoformat()})).status_code == 422
    assert (await api.client.patch(f"/api/v1/events/{eid}",headers=host,json={"title":None})).status_code == 422
    await api.client.post(f"/api/v1/events/{eid}/staff",headers=host,json={"email":"staff@example.com"})
    await api.client.post(f"/api/v1/events/{eid}/registrations",headers=joiner)
    ticket = (await api.client.post(f"/api/v1/events/{eid}/ticket",headers=joiner)).json()
    other = (await api.client.post("/api/v1/events",headers=host,json=payload(title="Another event"))).json()["id"]
    assert (await api.client.post(f"/api/v1/events/{other}/check-ins/scan",headers=host,json={"token":ticket["token"]})).status_code == 404
    async with api.sessions() as db:
        event = await db.get(Event,eid); event.starts_at = past; event.ends_at = past+timedelta(hours=4); await db.commit()
    assert (await api.client.patch(f"/api/v1/events/{eid}/staff/me",headers=staff,json={"status":"accepted"})).status_code == 409
    assert (await api.client.post(f"/api/v1/events/{eid}/check-ins/scan",headers=host,json={"token":ticket["token"]})).status_code == 409


@pytest.mark.asyncio
async def test_concurrent_registration_does_not_duplicate_rows(api):
    _, _, eid = await host_event(api)
    _, joiner = await account(api,"attendee")
    responses = await asyncio.gather(*[api.client.post(f"/api/v1/events/{eid}/registrations",headers=joiner) for _ in range(2)])
    assert sorted(r.status_code for r in responses) == [201,409]
    assert (await api.client.get(f"/api/v1/events/{eid}")).json()["going"] == 1
