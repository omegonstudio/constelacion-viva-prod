import pytest


async def login(async_client, email: str, password: str) -> str:
    resp = await async_client.post("/auth/login?tenant_id=1", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_login_therapist_and_me_role(async_client):
    token = await login(async_client, "therapist@local.dev", "therapist123!")
    me = await async_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    data = me.json()
    assert data["role"] == "therapist"


@pytest.mark.asyncio
async def test_therapist_dashboard_requires_therapist(async_client):
    therapist_token = await login(async_client, "therapist@local.dev", "therapist123!")
    ok = await async_client.get("/therapist/dashboard", headers={"Authorization": f"Bearer {therapist_token}"})
    assert ok.status_code == 200
    assert ok.json()["role"] == "therapist"

    admin_token = await login(async_client, "admin@local.dev", "admin12345!")
    forbidden = await async_client.get("/therapist/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert forbidden.status_code == 403

    noauth = await async_client.get("/therapist/dashboard")
    # HTTPBearer suele devolver 403 si falta Authorization
    assert noauth.status_code in (401, 403)


