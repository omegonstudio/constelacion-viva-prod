"""Tenancy middleware."""
from fastapi import HTTPException, status, Query, Header
from typing import Optional


async def get_tenant_id(
    tenant_id: Optional[int] = Query(None),
    x_tenant_id: Optional[int] = Header(None)
) -> int:
    """Dependency: get tenant_id from query or header."""
    tid = tenant_id or x_tenant_id
    if not tid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id required"
        )
    return tid
