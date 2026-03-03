import pytest


@pytest.mark.asyncio
async def test_cors_preflight_public_gallery_no_wildcard(async_client):
    origin = "http://localhost:3000"
    resp = await async_client.options(
        "/public/gallery",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert resp.status_code in (200, 204)
    assert resp.headers.get("access-control-allow-origin") == origin
    assert resp.headers.get("access-control-allow-credentials") == "true"
    assert resp.headers.get("access-control-allow-origin") != "*"


@pytest.mark.asyncio
async def test_cors_preflight_auth_login_no_wildcard(async_client):
    origin = "http://localhost:3000"
    resp = await async_client.options(
        "/auth/login?tenant_id=1",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    assert resp.status_code in (200, 204)
    assert resp.headers.get("access-control-allow-origin") == origin
    assert resp.headers.get("access-control-allow-credentials") == "true"
    assert resp.headers.get("access-control-allow-origin") != "*"


