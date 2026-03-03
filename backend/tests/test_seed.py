import pytest
from app.models import RoleEnum


@pytest.mark.asyncio
async def test_seed_created_admin(async_client):
    # Validación “real” vía API (sin acceso directo a DB)
    resp = await async_client.post(
        "/auth/login?tenant_id=1",
        json={"email": "admin@local.dev", "password": "admin12345!"},
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]

    me = await async_client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    data = me.json()
    assert data["role"] == RoleEnum.SUPER_ADMIN
    assert data["is_active"] is True

