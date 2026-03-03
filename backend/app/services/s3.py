"""S3 service for media uploads and storage."""
from typing import Optional
from app.core.config import Settings


class S3NotConfiguredError(RuntimeError):
    """Raised when S3 is required but not configured."""
    pass


def validate_s3_config(settings: Settings) -> None:
    """
    Validate S3 configuration for production environments.
    
    In development: S3 is optional, no validation.
    In production: All S3 fields must be present if S3 features are invoked.
    
    Args:
        settings: Application settings
        
    Raises:
        S3NotConfiguredError: If in production and any S3 field is missing
    """
    if settings.environment != "production":
        return
    
    missing_fields = []
    
    if not settings.s3_bucket:
        missing_fields.append("s3_bucket")
    if not settings.s3_region:
        missing_fields.append("s3_region")
    if not settings.s3_access_key:
        missing_fields.append("s3_access_key")
    if not settings.s3_secret_key:
        missing_fields.append("s3_secret_key")
    if not settings.s3_endpoint:
        missing_fields.append("s3_endpoint")
    
    if missing_fields:
        raise S3NotConfiguredError(
            f"S3 is required in production but missing configuration: {', '.join(missing_fields)}. "
            f"Set the following environment variables: {', '.join(f.upper() for f in missing_fields)}"
        )


def get_s3_client(settings: Settings):
    """
    Get an S3 client for media operations.
    
    In development: Returns None if S3 config is missing (graceful degradation).
    In production: Validates S3 config and raises error if missing.
    
    Args:
        settings: Application settings
        
    Returns:
        S3 client instance (boto3) or None if not configured in development
        
    Raises:
        S3NotConfiguredError: If in production and S3 config is incomplete
    """
    # Validate production config
    validate_s3_config(settings)
    
    # Return None if not configured (development mode)
    if not all([settings.s3_bucket, settings.s3_region, 
                settings.s3_access_key, settings.s3_secret_key, 
                settings.s3_endpoint]):
        return None
    
    # Import boto3 only when needed
    try:
        import boto3
    except ImportError:
        raise ImportError("boto3 is required for S3 support. Install with: pip install boto3")
    
    # Create and return boto3 S3 client
    client = boto3.client(
        "s3",
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        endpoint_url=settings.s3_endpoint if settings.s3_endpoint != "https://s3.amazonaws.com" else None,
    )
    
    return client


def is_s3_configured(settings: Settings) -> bool:
    """
    Check if S3 is configured.
    
    Args:
        settings: Application settings
        
    Returns:
        True if all required S3 fields are present, False otherwise
    """
    return all([
        settings.s3_bucket,
        settings.s3_region,
        settings.s3_access_key,
        settings.s3_secret_key,
        settings.s3_endpoint,
    ])
