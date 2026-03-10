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


def _is_virtual_hosted(settings: Settings) -> bool:
    """
    Return True when s3_public_endpoint already has the bucket name in the domain,
    e.g. https://constelacion-viva-prod.sfo3.digitaloceanspaces.com

    This drives addressing_style for boto3:
      - virtual → bucket in domain, key in path  (DigitalOcean Spaces production)
      - path    → /bucket/key                    (LocalStack dev)
    """
    base = settings.s3_public_endpoint or settings.s3_endpoint or ""
    netloc = urlparse(base).netloc
    return bool(settings.s3_bucket and netloc.startswith(f"{settings.s3_bucket}."))


def get_s3_client(settings: Settings):
    """
    Create boto3 client.

    - Production (DO Spaces virtual-hosted): addressing_style=virtual
      boto3 prepends bucket to the endpoint domain and the key has no bucket prefix.
    - Dev (LocalStack path-style): addressing_style=path
      boto3 appends /bucket/key to the endpoint URL (existing behaviour).
    """
    from botocore.config import Config

    validate_s3_config(settings)
    addressing_style = "virtual" if _is_virtual_hosted(settings) else "path"
    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        endpoint_url=settings.s3_endpoint,
        config=Config(s3={"addressing_style": addressing_style}),
    )


def ensure_bucket_exists(client, bucket: str):
    """Create bucket if missing (idempotente, dev)."""
    try:
        client.head_bucket(Bucket=bucket)
    except ClientError:
        client.create_bucket(Bucket=bucket)


def build_public_url(settings: Settings, key: str) -> str:
    """
    Build the public URL for an uploaded object.

    - Virtual-hosted (DO Spaces): bucket already in domain → base/key
      e.g. https://constelacion-viva-prod.sfo3.digitaloceanspaces.com/gallery/uuid.jpg
    - Path-style (LocalStack dev): base/bucket/key
      e.g. http://localhost:4566/constelacion-viva-prod/gallery/uuid.jpg
    """
    base = settings.s3_public_endpoint or settings.s3_endpoint or ""
    base = base.rstrip("/")
    if _is_virtual_hosted(settings):
        return f"{base}/{key}"
    return f"{base}/{settings.s3_bucket}/{key}"

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
            "ACL": "public-read",
            # ContentType is intentionally excluded from signed params.
            # Including it forces "content-type" into X-Amz-SignedHeaders,
            # which causes 403 when the browser value differs even slightly
            # (e.g. empty file.type, browser normalization).
            # The browser still sends Content-Type in the PUT request and
            # DigitalOcean Spaces uses it to set the object's content type.
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

    Handles both URL styles:
    - Virtual-hosted: https://bucket.region.digitaloceanspaces.com/gallery/uuid.jpg
      → key = "gallery/uuid.jpg"
    - Path-style (LocalStack): http://localhost:4566/bucket/gallery/uuid.jpg
      → key = "gallery/uuid.jpg"
    """
    parsed = urlparse(url)

    # Virtual-hosted style: bucket is part of the domain, not the path.
    if settings.s3_bucket and parsed.netloc.startswith(f"{settings.s3_bucket}."):
        key = parsed.path.lstrip("/")
        if not key:
            return False
        return delete_file(settings, key)

    # Path-style: /{bucket}/{key}
    path = parsed.path.lstrip("/")
    parts = path.split("/", 1)
    if len(parts) != 2:
        return False

    bucket, key = parts
    if bucket != settings.s3_bucket:
        return False

    return delete_file(settings, key)
