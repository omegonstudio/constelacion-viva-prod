import pytest
from botocore.exceptions import ClientError

from app.core.config import Settings
from app.services import storage_service


def make_settings(**overrides):
    base = {
        "database_url": "postgresql+asyncpg://x:x@localhost:5432/x",
        "secret_key": "x",
        "s3_bucket": "bucket",
        "s3_region": "us-east-1",
        "s3_access_key": "ak",
        "s3_secret_key": "sk",
        "s3_endpoint": "http://localhost:4566",
        "s3_public_endpoint": "http://localhost:4566",
        "environment": "development",
    }
    base.update(overrides)
    return Settings(**base)  # type: ignore


def test_validate_s3_config_missing_fields_raises():
    settings = make_settings(s3_bucket=None)
    with pytest.raises(storage_service.S3NotConfiguredError):
        storage_service.validate_s3_config(settings)


def test_build_public_url_uses_public_endpoint():
    settings = make_settings(s3_public_endpoint="https://cdn.example.test", s3_endpoint="http://ignored")
    url = storage_service.build_public_url(settings, "gallery/a.jpg")
    assert url == "https://cdn.example.test/bucket/gallery/a.jpg"


def test_ensure_bucket_exists_creates_on_head_error(monkeypatch):
    calls = {"create": 0}

    class FakeClient:
        def head_bucket(self, Bucket):
            raise ClientError({"Error": {"Code": "404"}}, "HeadBucket")

        def create_bucket(self, Bucket):
            calls["create"] += 1

    storage_service.ensure_bucket_exists(FakeClient(), "bucket")
    assert calls["create"] == 1


def test_get_s3_client_calls_boto3_client(monkeypatch):
    settings = make_settings()
    captured = {}

    def fake_client(service, **kwargs):
        captured["service"] = service
        captured.update(kwargs)
        return object()

    monkeypatch.setattr(storage_service.boto3, "client", fake_client)
    c = storage_service.get_s3_client(settings)
    assert captured["service"] == "s3"
    assert captured["region_name"] == "us-east-1"
    assert captured["endpoint_url"] == "http://localhost:4566"
    assert c is not None


def test_upload_file_bytes_puts_object_and_returns_url(monkeypatch):
    settings = make_settings()
    put_calls = {}

    class FakeClient:
        def head_bucket(self, Bucket):
            return True

        def put_object(self, **kwargs):
            put_calls.update(kwargs)

    monkeypatch.setattr(storage_service, "get_s3_client", lambda s: FakeClient())

    out = storage_service.upload_file_bytes(settings, b"abc", "k1", None)
    assert out["key"] == "k1"
    assert out["url"].endswith("/bucket/k1")
    assert put_calls["Bucket"] == "bucket"
    assert put_calls["Key"] == "k1"
    assert put_calls["ContentType"] == "application/octet-stream"


def test_upload_file_generates_key_and_calls_upload_file_bytes(monkeypatch):
    settings = make_settings()

    monkeypatch.setattr(storage_service, "uuid4", lambda: "uuid")  # deterministic

    captured = {}

    def fake_upload_bytes(settings, file_bytes, key, content_type):
        captured["key"] = key
        return {"key": key, "url": "u"}

    monkeypatch.setattr(storage_service, "upload_file_bytes", fake_upload_bytes)
    out = storage_service.upload_file(settings, b"data", "file.png", "image/png")
    assert out["key"] == "uploads/uuid_file.png"
    assert captured["key"] == "uploads/uuid_file.png"


def test_delete_file_returns_true_on_success(monkeypatch):
    settings = make_settings()

    class FakeClient:
        def head_bucket(self, Bucket):
            return True

        def delete_object(self, **kwargs):
            return True

    monkeypatch.setattr(storage_service, "get_s3_client", lambda s: FakeClient())
    assert storage_service.delete_file(settings, "k") is True


def test_delete_file_returns_false_on_client_error(monkeypatch):
    settings = make_settings()

    class FakeClient:
        def head_bucket(self, Bucket):
            return True

        def delete_object(self, **kwargs):
            raise ClientError({"Error": {"Code": "500"}}, "DeleteObject")

    monkeypatch.setattr(storage_service, "get_s3_client", lambda s: FakeClient())
    assert storage_service.delete_file(settings, "k") is False


def test_create_presigned_upload_builds_key_and_returns_urls(monkeypatch):
    settings = make_settings(s3_endpoint="http://localstack:4566", s3_public_endpoint="http://localhost:4566")

    class FakeClient:
        def head_bucket(self, Bucket):
            return True

        def generate_presigned_url(self, ClientMethod, Params, ExpiresIn):
            assert ClientMethod == "put_object"
            assert Params["Bucket"] == "bucket"
            assert Params["ContentType"] == "image/jpeg"
            assert ExpiresIn == 123
            # simulate LocalStack internal hostname inside docker network
            return "http://localstack:4566/bucket/gallery/abc123.jpg?AWSAccessKeyId=x&Signature=y"

    monkeypatch.setattr(storage_service, "get_s3_client", lambda s: FakeClient())

    class FakeUUID:
        hex = "abc123"

    monkeypatch.setattr(storage_service, "uuid4", lambda: FakeUUID())

    res = storage_service.create_presigned_upload(settings, "a.JPG", "image/jpeg", folder="gallery", expires_in=123)
    assert res.upload_url.startswith("http://localhost:4566/")
    assert "AWSAccessKeyId=x" in res.upload_url
    assert "Signature=y" in res.upload_url
    assert res.object_key == "gallery/abc123.jpg"
    assert res.public_url.endswith("/bucket/gallery/abc123.jpg")


def test_get_file_url_is_build_public_url():
    settings = make_settings(s3_public_endpoint="https://cdn.example.test")
    assert storage_service.get_file_url(settings, "k") == "https://cdn.example.test/bucket/k"


def test_delete_file_from_public_url_parsing():
    settings = make_settings(s3_bucket="bucket")

    # formato inválido
    assert storage_service.delete_file_from_public_url(settings, "https://cdn.example.test/onlybucket") is False

    # bucket no coincide
    assert storage_service.delete_file_from_public_url(settings, "https://cdn.example.test/other/k") is False


def test_delete_file_from_public_url_calls_delete_file(monkeypatch):
    settings = make_settings(s3_bucket="bucket")
    called = {}
    def fake_delete(s, key):
        called["key"] = key
        return True
    monkeypatch.setattr(storage_service, "delete_file", fake_delete)
    assert storage_service.delete_file_from_public_url(settings, "https://cdn.example.test/bucket/gallery/x.jpg") is True
    assert called["key"] == "gallery/x.jpg"


