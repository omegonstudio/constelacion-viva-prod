import pytest
from app.core.security import verify_password, hash_password


@pytest.mark.asyncio
async def test_login_success(async_client):
    payload = {"email": "admin@local.dev", "password": "admin12345!"}
    resp = await async_client.post("/auth/login?tenant_id=1", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(async_client):
    payload = {"email": "admin@local.dev", "password": "wrong"}
    resp = await async_client.post("/auth/login?tenant_id=1", json=payload)
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_wrong_tenant(async_client):
    payload = {"email": "admin@local.dev", "password": "admin12345!"}
    resp = await async_client.post("/auth/login?tenant_id=9999", json=payload)
    # backend returns 401 when user not found
    assert resp.status_code in (401, 404)


def test_verify_password_hash_roundtrip():
    pwd = "demo123!"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrong", hashed) is False

