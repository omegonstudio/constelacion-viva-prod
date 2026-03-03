import pytest

from app.routes import admin_gallery as admin_gallery_routes
from app.schemas.gallery import GalleryCreate, GalleryUpdate, GalleryPresignRequest
from app.services.storage_service import PresignedUploadResult


class FakeDB:
    def __init__(self, item=None):
        self._item = item
        self.added = []
        self.committed = 0
        self.refreshed = 0
        self.deleted = []

    async def get(self, model, item_id):
        return self._item

    def add(self, item):
        self.added.append(item)

    async def commit(self):
        self.committed += 1

    async def refresh(self, item):
        self.refreshed += 1

    async def delete(self, item):
        self.deleted.append(item)


@pytest.mark.asyncio
async def test_presign_gallery_upload_unit(monkeypatch):
    monkeypatch.setattr("app.routes.admin_gallery.get_settings", lambda: object())

    def fake_presign(*, settings, filename, content_type, folder, expires_in=300):
        assert folder == "gallery"
        return PresignedUploadResult("u", "k", "p")

    monkeypatch.setattr("app.routes.admin_gallery.storage_service.create_presigned_upload", fake_presign)

    out = await admin_gallery_routes.presign_gallery_upload(GalleryPresignRequest(filename="a.jpg", contentType="image/jpeg"))
    assert out == {"uploadUrl": "u", "objectKey": "k", "publicUrl": "p"}


@pytest.mark.asyncio
async def test_create_gallery_item_unit():
    db = FakeDB()
    payload = GalleryCreate(title="t", type="image", category="eventos", src="https://x")
    item = await admin_gallery_routes.create_gallery_item(payload, db=db)
    assert db.committed == 1
    assert db.refreshed == 1
    assert item.title == "t"


@pytest.mark.asyncio
async def test_update_gallery_item_not_found_unit():
    db = FakeDB(item=None)
    with pytest.raises(Exception) as exc:
        await admin_gallery_routes.update_gallery_item(1, GalleryUpdate(title="x"), db=db)
    # FastAPI HTTPException
    assert getattr(exc.value, "status_code", None) == 404
    assert getattr(exc.value, "detail", None) == "Gallery item not found"


@pytest.mark.asyncio
async def test_update_gallery_item_updates_fields_unit():
    class Obj:
        def __init__(self):
            self.title = "old"
            self.category = "eventos"

    obj = Obj()
    db = FakeDB(item=obj)
    payload = GalleryUpdate(title="new")
    out = await admin_gallery_routes.update_gallery_item(1, payload, db=db)
    assert out.title == "new"
    assert db.committed == 1
    assert db.refreshed == 1


@pytest.mark.asyncio
async def test_delete_gallery_item_idempotent_unit():
    db = FakeDB(item=None)
    out = await admin_gallery_routes.delete_gallery_item(123, db=db)
    assert out == {"ok": True}


@pytest.mark.asyncio
async def test_delete_gallery_item_storage_failure_is_ignored_unit(monkeypatch):
    class Obj:
        def __init__(self):
            self.src = "https://cdn/bucket/key"

    obj = Obj()
    db = FakeDB(item=obj)
    monkeypatch.setattr("app.routes.admin_gallery.get_settings", lambda: object())

    def boom(settings, url):
        raise RuntimeError("S3 down")

    monkeypatch.setattr("app.routes.admin_gallery.storage_service.delete_file_from_public_url", boom)

    out = await admin_gallery_routes.delete_gallery_item(1, db=db)
    assert out == {"ok": True}
    assert db.committed == 1
    assert db.deleted == [obj]


