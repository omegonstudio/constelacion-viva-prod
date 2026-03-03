import pytest


@pytest.mark.asyncio
async def login(async_client, email: str, password: str) -> str:
    resp = await async_client.post("/auth/login?tenant_id=1", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


async def clear_gallery(async_client, token: str) -> None:
    resp = await async_client.get("/public/gallery")
    assert resp.status_code == 200
    for item in resp.json():
        await async_client.delete(f"/admin/gallery/{item['id']}", headers={"Authorization": f"Bearer {token}"})


@pytest.mark.asyncio
async def test_public_gallery_list_empty(async_client):
    token = await login(async_client, "admin@local.dev", "admin12345!")
    await clear_gallery(async_client, token)

    resp = await async_client.get("/public/gallery")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_public_gallery_list_items_structure(async_client):
    token = await login(async_client, "admin@local.dev", "admin12345!")
    await clear_gallery(async_client, token)

    create1 = await async_client.post(
        "/admin/gallery",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Uno", "type": "image", "category": "eventos", "src": "https://cdn.example.test/1.jpg"},
    )
    assert create1.status_code == 200

    create2 = await async_client.post(
        "/admin/gallery",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Dos",
            "type": "video",
            "category": "terapeutas",
            "src": "https://cdn.example.test/2.jpg",
        },
    )
    assert create2.status_code == 200

    resp = await async_client.get("/public/gallery")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 2

    for row in data:
        assert set(row.keys()) >= {"id", "title", "type", "category", "src", "video_src", "created_at"}


