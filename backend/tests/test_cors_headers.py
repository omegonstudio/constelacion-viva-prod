"""CORS header tests.

Validates that credentialed cross-origin requests from allowed origins receive
the correct CORS headers, and that no wildcard (*) appears in either
Access-Control-Allow-Origin or Access-Control-Allow-Headers when
credentials are in use.
"""
import pytest


# ---------------------------------------------------------------------------
# Allowed origins
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Access-Control-Allow-Headers must NOT be "*" with credentialed requests.
# Starlette 0.27.x returns "*" unconditionally when allow_all_headers=True,
# which Chrome 96+ / Firefox 95+ reject per spec for credentialed requests.
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cors_preflight_allow_headers_no_wildcard(async_client):
    """Preflight must never return Access-Control-Allow-Headers: * with credentials."""
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
    allow_headers = resp.headers.get("access-control-allow-headers", "")
    assert allow_headers != "*", (
        "Access-Control-Allow-Headers must not be '*' when allow_credentials=True. "
        "Browsers (Chrome 96+, Firefox 95+) treat '*' as a literal header name for "
        "credentialed requests, causing CORS failures."
    )


@pytest.mark.asyncio
async def test_cors_preflight_allow_headers_lists_required_headers(async_client):
    """Preflight must explicitly list Authorization and Content-Type."""
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
    allow_headers_raw = resp.headers.get("access-control-allow-headers", "")
    allow_headers = [h.strip().lower() for h in allow_headers_raw.split(",")]
    assert "authorization" in allow_headers, (
        f"Authorization must be in Access-Control-Allow-Headers. Got: {allow_headers_raw!r}"
    )
    assert "content-type" in allow_headers, (
        f"Content-Type must be in Access-Control-Allow-Headers. Got: {allow_headers_raw!r}"
    )


# ---------------------------------------------------------------------------
# Simple (non-preflight) credentialed request must also echo back origin.
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cors_simple_request_no_wildcard_origin(async_client):
    """A real POST /auth/login response must reflect the origin, never '*'."""
    origin = "http://localhost:3000"
    resp = await async_client.post(
        "/auth/login?tenant_id=1",
        json={"email": "admin@local.dev", "password": "admin12345!"},
        headers={"Origin": origin},
    )
    # Whether login succeeds or fails, CORS headers must be present and correct.
    acao = resp.headers.get("access-control-allow-origin", "")
    assert acao != "*", (
        "Access-Control-Allow-Origin must not be '*' when credentials are in use."
    )
    assert acao == origin, (
        f"Access-Control-Allow-Origin must echo the request Origin. "
        f"Got {acao!r}, expected {origin!r}."
    )


# ---------------------------------------------------------------------------
# Unknown / disallowed origin must NOT receive CORS headers.
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_cors_disallowed_origin_no_acao_header(async_client):
    """Requests from an unknown origin must not receive Access-Control-Allow-Origin."""
    origin = "http://evil.example.com"
    resp = await async_client.options(
        "/auth/login?tenant_id=1",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    acao = resp.headers.get("access-control-allow-origin", "")
    assert acao == "", (
        f"Disallowed origin must not receive Access-Control-Allow-Origin. Got: {acao!r}"
    )
    assert acao != "*"
