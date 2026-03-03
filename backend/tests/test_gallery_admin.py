import pytest

from app.services.storage_service import PresignedUploadResult


async def login(async_client, email: str, password: str) -> str:
    resp = await async_client.post("/auth/login?tenant_id=1", json={"email": email, "password": password})
    assert resp.status_code == 200
    data = resp.json()
    return data["access_token"]

async def clear_gallery(async_client, token: str) -> None:
    resp = await async_client.get("/public/gallery")
    assert resp.status_code == 200
    items = resp.json()
    for item in items:
        await async_client.delete(f"/admin/gallery/{item['id']}", headers={"Authorization": f"Bearer {token}"})


@pytest.mark.asyncio
async def test_admin_gallery_presign_requires_auth(async_client):
    resp = await async_client.post("/admin/gallery/presign", json={"filename": "a.jpg", "contentType": "image/jpeg"})
    # HTTPBearer devuelve 403 cuando falta Authorization
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_gallery_presign_success(async_client, monkeypatch):
    token = await login(async_client, "admin@local.dev", "admin12345!")

    def fake_presign(*, settings, filename: str, content_type: str, folder: str, expires_in: int = 300):
        assert filename == "a.jpg"
        assert content_type == "image/jpeg"
        assert folder == "gallery"
        return PresignedUploadResult(
            upload_url="https://example.test/upload",
            object_key="gallery/obj.jpg",
            public_url="https://cdn.example.test/bucket/gallery/obj.jpg",
        )

    monkeypatch.setattr("app.services.storage_service.create_presigned_upload", fake_presign)

    resp = await async_client.post(
        "/admin/gallery/presign",
        headers={"Authorization": f"Bearer {token}"},
        json={"filename": "a.jpg", "contentType": "image/jpeg"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["uploadUrl"] == "https://example.test/upload"
    assert data["objectKey"] == "gallery/obj.jpg"
    assert data["publicUrl"].startswith("https://")


@pytest.mark.asyncio
async def test_admin_gallery_options_preflight_does_not_break(async_client):
    resp = await async_client.options(
        "/admin/gallery/presign",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert resp.status_code in (200, 204)


@pytest.mark.asyncio
async def test_admin_gallery_create_validates_and_persists(async_client):
    token = await login(async_client, "admin@local.dev", "admin12345!")
    await clear_gallery(async_client, token)
    payload = {
        "title": "Foto 1",
        "type": "image",
        "category": "eventos",
        "src": "https://cdn.example.test/gallery/1.jpg",
    }
    resp = await async_client.post("/admin/gallery", headers={"Authorization": f"Bearer {token}"}, json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Foto 1"
    assert data["type"] == "image"
    assert data["category"] == "eventos"
    assert data["src"] == payload["src"]
    assert "id" in data

    # Verificar persistencia vía API pública
    public = await async_client.get("/public/gallery")
    assert public.status_code == 200
    items = public.json()
    assert any(i["id"] == data["id"] and i["title"] == "Foto 1" for i in items)


@pytest.mark.asyncio
async def test_admin_gallery_create_schema_rejects_invalid_enum(async_client):
    token = await login(async_client, "admin@local.dev", "admin12345!")
    resp = await async_client.post(
        "/admin/gallery",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "X", "type": "nope", "category": "eventos", "src": "https://x"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_admin_gallery_delete_deletes_db_and_tolerates_s3_failure(async_client, monkeypatch):
    token = await login(async_client, "admin@local.dev", "admin12345!")
    await clear_gallery(async_client, token)

    created = await async_client.post(
        "/admin/gallery",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Borrar",
            "type": "image",
            "category": "eventos",
            "src": "https://cdn.example.test/bucket/gallery/a.jpg",
        },
    )
    assert created.status_code == 200
    item_id = created.json()["id"]

    def fake_delete_from_url(settings, url: str) -> bool:
        raise RuntimeError("S3 down")

    monkeypatch.setattr("app.services.storage_service.delete_file_from_public_url", fake_delete_from_url)

    resp = await async_client.delete(f"/admin/gallery/{item_id}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}

    public = await async_client.get("/public/gallery")
    assert public.status_code == 200
    assert all(i["id"] != item_id for i in public.json())


@pytest.mark.asyncio
async def test_admin_gallery_delete_is_idempotent(async_client, monkeypatch):
    monkeypatch.setattr("app.services.storage_service.delete_file_from_public_url", lambda settings, url: True)

    token = await login(async_client, "admin@local.dev", "admin12345!")
    # item no existe -> ok=True (idempotente)
    resp = await async_client.delete("/admin/gallery/999999", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


@pytest.mark.asyncio
async def test_admin_gallery_rejects_non_admin(async_client):
    # crear usuario no-admin vía API (sin tocar DB directo)
    reg = await async_client.post(
        "/auth/register",
        json={
            "email": "student1@local.dev",
            "password": "student12345!",
            "first_name": "Student",
            "last_name": "One",
            "tenant_id": 1,
        },
    )
    assert reg.status_code in (200, 400)  # 400 si ya existía por una corrida previa
    if reg.status_code == 200:
        token = reg.json()["access_token"]
    else:
        token = await login(async_client, "student1@local.dev", "student12345!")

    resp = await async_client.post(
        "/admin/gallery/presign",
        headers={"Authorization": f"Bearer {token}"},
        json={"filename": "a.jpg", "contentType": "image/jpeg"},
    )
    assert resp.status_code == 403


