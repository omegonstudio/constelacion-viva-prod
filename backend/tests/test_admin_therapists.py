import pytest


async def login(async_client, email: str, password: str) -> str:
    resp = await async_client.post("/auth/login?tenant_id=1", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_therapists_requires_admin(async_client):
    # therapist token should be forbidden (admin only)
    token = await login(async_client, "therapist@local.dev", "therapist123!")
    resp = await async_client.get("/admin/therapists", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_therapists_list_shape_and_contains_therapist(async_client):
    token = await login(async_client, "admin@local.dev", "admin12345!")
    resp = await async_client.get("/admin/therapists", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    therapist = next((t for t in data if t["email"] == "therapist@local.dev"), None)
    assert therapist is not None
    assert therapist["role"] == "therapist"
    assert therapist["membership_status"] in ("pending", "active", "inactive")
    assert therapist["payment_status"] in ("paid", "pending", "overdue", "na")


@pytest.mark.asyncio
async def test_admin_therapist_detail(async_client):
    token = await login(async_client, "admin@local.dev", "admin12345!")
    # fetch list to get id deterministically
    resp = await async_client.get("/admin/therapists", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    therapist = next((t for t in resp.json() if t["email"] == "therapist@local.dev"), None)
    assert therapist is not None

    detail = await async_client.get(f"/admin/therapists/{therapist['id']}", headers={"Authorization": f"Bearer {token}"})
    assert detail.status_code == 200
    body = detail.json()
    assert body["email"] == "therapist@local.dev"
    assert body["role"] == "therapist"
    assert "plan_months" in body


