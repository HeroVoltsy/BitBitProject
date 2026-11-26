from datetime import datetime, timedelta, timezone

import pytest

from src.models.event import Event
from tests.test_kyc import api, account


async def create_event(api, headers, title="Community concert", **extra):
    response = await api.client.post("/api/v1/events", headers=headers, json={
        "title": title, "category": "Music", "location": "Naga City",
        "starts_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        **extra,
    })
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_guests_browse_only_published_events(api):
    _, headers = await account(api, "host")
    published = await create_event(api, headers)
    hidden = []
    for state in ("draft", "cancelled"):
        event = await create_event(api, headers, title=f"Hidden {state}")
        hidden.append(event["id"])
        async with api.sessions() as db:
            (await db.get(Event, event["id"])).status = state
            await db.commit()

    response = await api.client.get("/api/v1/events")
    assert response.status_code == 200
    assert [event["id"] for event in response.json()] == [published["id"]]
    assert response.json()[0] == published
    assert (await api.client.get(f"/api/v1/events/{published['id']}")).status_code == 200
    for event_id in hidden:
        assert (await api.client.get(f"/api/v1/events/{event_id}")).status_code == 404

    # An expired/invalid stored token must not prevent browsing public content.
    assert (await api.client.get("/api/v1/events", headers={
        "Authorization": "Bearer invalid-token",
    })).json() == response.json()


@pytest.mark.asyncio
async def test_guest_search_filters_and_pagination(api):
    host_id, headers = await account(api, "host")
    first = await create_event(api, headers, title="Local concert", starts_at="2098-01-01T10:00:00Z")
    second = await create_event(api, headers, title="Evening concert", starts_at="2098-01-02T10:00:00Z")
    await create_event(api, headers, title="Morning workout", category="Sports")
    response = await api.client.get("/api/v1/events", params={
        "q": "CONCERT", "category": "Music", "host_id": host_id,
        "starts_after": "2098-01-01T00:00:00Z",
        "starts_before": "2098-01-03T00:00:00Z", "limit": 1,
    })
    assert response.status_code == 200
    assert [e["id"] for e in response.json()] == [first["id"]]
    response = await api.client.get(str(response.request.url), params={
        **dict(response.request.url.params), "offset": 1,
    })
    assert [e["id"] for e in response.json()] == [second["id"]]
    assert (await api.client.get("/api/v1/events", params={"q": "no such event"})).json() == []


@pytest.mark.asyncio
async def test_mine_requires_a_valid_login_and_filters_by_owner(api):
    _, host = await account(api, "host")
    _, other = await account(api, "other")
    own_event = await create_event(api, host)
    await create_event(api, other, title="Another organizer's event")
    for headers in ({}, {"Authorization": "Bearer invalid-token"}):
        response = await api.client.get("/api/v1/events?mine=true", headers=headers)
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"
    response = await api.client.get("/api/v1/events?mine=true", headers=host)
    assert response.status_code == 200
    assert [event["id"] for event in response.json()] == [own_event["id"]]


@pytest.mark.asyncio
async def test_guest_browsing_does_not_open_private_or_write_endpoints(api):
    host_id, host = await account(api, "host")
    event = await create_event(api, host)
    path = f"/api/v1/events/{event['id']}"
    for method, url, body in [
        ("POST", "/api/v1/events", {
            "title": "Unauthorized event", "category": "Music",
            "starts_at": "2098-01-01T10:00:00Z", "location": "Naga City",
        }),
        ("PATCH", path, {"title": "Unauthorized edit"}),
        ("DELETE", path, None),
        ("POST", path + "/registrations", None),
        ("GET", path + "/registrations/me", None),
        ("DELETE", path + "/registrations/me", None),
        ("GET", path + "/attendees", None),
        ("POST", path + "/ticket", None),
        ("POST", path + "/check-ins/scan", {"token": "unauthorized-test-token-value"}),
        ("GET", path + "/staff", None),
        ("POST", path + "/staff", {"user_id": host_id}),
        ("PATCH", path + "/staff/me", {"status": "accepted"}),
        ("DELETE", path + f"/staff/{host_id}", None),
        ("GET", "/users/me", None),
        ("GET", "/api/v1/kyc/me", None),
    ]:
        response = await api.client.request(method, url, json=body)
        assert response.status_code == 401, (method, url, response.text)
    assert (await api.client.get(path)).json()["title"] == event["title"]
