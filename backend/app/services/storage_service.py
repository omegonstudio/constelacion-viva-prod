"""S3 storage service (LocalStack-compatible for dev)."""
from typing import Optional
from uuid import uuid4
import boto3
from botocore.exceptions import ClientError
from app.core.config import Settings
from dataclasses import dataclass
from urllib.parse import urlparse, urlunparse

@dataclass
class PresignedUploadResult:
    upload_url: str
    object_key: str
    public_url: str


class S3NotConfiguredError(RuntimeError):
    """Raised when S3 is required but not configured."""
    pass


def validate_s3_config(settings: Settings) -> None:
    """
    Ensure all S3 fields are present. In dev we still validate because uploads necesitan LocalStack.
    """
    if not all([
        settings.s3_bucket,
        settings.s3_region,
        settings.s3_access_key,
        settings.s3_secret_key,
        settings.s3_endpoint,
    ]):
        raise S3NotConfiguredError("S3 configuration is incomplete (dev LocalStack expected).")


def get_s3_client(settings: Settings):
    """Create boto3 client (LocalStack-compatible)."""
    validate_s3_config(settings)
    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        endpoint_url=settings.s3_endpoint,
    )


def ensure_bucket_exists(client, bucket: str):
    """Create bucket if missing (idempotente, dev)."""
    try:
        client.head_bucket(Bucket=bucket)
    except ClientError:
        client.create_bucket(Bucket=bucket)


def build_public_url(settings: Settings, key: str) -> str:
    """Generate public-ish URL (LocalStack uses endpoint + bucket + key)."""
    base = settings.s3_public_endpoint or settings.s3_endpoint or ""
    return f"{base.rstrip('/')}/{settings.s3_bucket}/{key}"

def rewrite_presigned_url_base(upload_url: str, internal_base: str | None, public_base: str | None) -> str:
    """
    Rewrite scheme+host+port in a presigned URL so it's reachable from the browser.

    - internal_base: endpoint used by backend (inside docker network), e.g. http://localstack:4566
    - public_base: endpoint reachable from host/browser, e.g. http://localhost:4566

    Important: we only replace scheme+netloc, keeping path+query intact.
    """
    if not internal_base or not public_base:
        return upload_url

    internal = urlparse(internal_base)
    public = urlparse(public_base)
    parsed = urlparse(upload_url)

    # Only rewrite if the generated URL matches the internal endpoint.
    if parsed.scheme == internal.scheme and parsed.netloc == internal.netloc:
        return urlunparse(parsed._replace(scheme=public.scheme, netloc=public.netloc))

    return upload_url


# --- Public helpers (DEV) ---

def upload_file_bytes(settings: Settings, file_bytes: bytes, key: str, content_type: Optional[str]) -> dict:
    """Upload raw bytes to S3/LocalStack; caller provides key."""
    client = get_s3_client(settings)
    ensure_bucket_exists(client, settings.s3_bucket)

    client.put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=file_bytes,
        ContentType=content_type or "application/octet-stream",
    )
    return {
        "key": key,
        "url": build_public_url(settings, key),
    }


def upload_file(settings: Settings, file_obj, filename: str, content_type: Optional[str]) -> dict:
    """
    Legacy helper (usado por endpoints existentes): genera key y sube.
    """
    key = f"uploads/{uuid4()}_{filename}"
    return upload_file_bytes(settings, file_obj, key, content_type)


def delete_file(settings: Settings, key: str) -> bool:
    """Delete object if exists; returns True even si no estaba (idempotente)."""
    client = get_s3_client(settings)
    ensure_bucket_exists(client, settings.s3_bucket)
    try:
        client.delete_object(Bucket=settings.s3_bucket, Key=key)
        return True
    except ClientError:
        return False


def get_file_url(settings: Settings, key: str) -> str:
    """Build URL without presign (solo dev LocalStack)."""
    return build_public_url(settings, key)

def create_presigned_upload(
    settings: Settings,
    filename: str,
    content_type: str,
    folder: str = "gallery",
    expires_in: int = 300,
) -> PresignedUploadResult:
    """
    Create a presigned PUT URL for direct upload from frontend.
    Compatible with LocalStack and real S3.
    """
    client = get_s3_client(settings)
    ensure_bucket_exists(client, settings.s3_bucket)

    ext = (filename.split(".")[-1] or "").lower()
    key = f"{folder}/{uuid4().hex}.{ext}" if ext else f"{folder}/{uuid4().hex}"

    upload_url = client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": settings.s3_bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )

    return PresignedUploadResult(
        upload_url=rewrite_presigned_url_base(upload_url, settings.s3_endpoint, settings.s3_public_endpoint),
        object_key=key,
        public_url=build_public_url(settings, key),
    )

def delete_file_from_public_url(settings: Settings, url: str) -> bool:
    """
    Delete S3 object given its public URL.
    Works with LocalStack-style URLs.
    """
    parsed = urlparse(url)
    path = parsed.path.lstrip("/")

    # esperado: /<bucket>/<key>
    parts = path.split("/", 1)
    if len(parts) != 2:
        return False

    bucket, key = parts
    if bucket != settings.s3_bucket:
        return False

    return delete_file(settings, key)
