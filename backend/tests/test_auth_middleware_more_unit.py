import pytest
from fastapi import HTTPException

from app.middlewares import auth as auth_mw
from app.models import RoleEnum


class DummyCreds:
    def __init__(self, token: str):
        self.credentials = token


class DummyUser:
    def __init__(self, role: RoleEnum):
        self.role = role


@pytest.mark.asyncio
async def test_get_optional_user_no_header_returns_none():
    class Req:
        headers = {}

    out = await auth_mw.get_optional_user(Req(), db=None)  # db no usado si no hay header
    assert out is None


@pytest.mark.asyncio
async def test_get_optional_user_invalid_token_returns_none(monkeypatch):
    class Req:
        headers = {"Authorization": "Bearer bad"}

    async def boom(db, token):
        raise RuntimeError("bad")

    monkeypatch.setattr(auth_mw.AuthService, "get_current_user", boom)
    out = await auth_mw.get_optional_user(Req(), db=None)
    assert out is None


@pytest.mark.asyncio
async def test_get_optional_user_valid_token_returns_user(monkeypatch):
    class Req:
        headers = {"Authorization": "Bearer good"}

    async def ok(db, token):
        assert token == "good"
        return "user"

    monkeypatch.setattr(auth_mw.AuthService, "get_current_user", ok)
    out = await auth_mw.get_optional_user(Req(), db=None)
    assert out == "user"


@pytest.mark.asyncio
async def test_get_current_user_calls_auth_service(monkeypatch):
    async def ok(db, token):
        return "user"

    monkeypatch.setattr(auth_mw.AuthService, "get_current_user", ok)
    out = await auth_mw.get_current_user(DummyCreds("t"), db=None)
    assert out == "user"


@pytest.mark.asyncio
async def test_require_admin_or_super_allows_and_denies():
    assert await auth_mw.require_admin_or_super(DummyUser(RoleEnum.ADMIN)) is not None
    assert await auth_mw.require_admin_or_super(DummyUser(RoleEnum.SUPER_ADMIN)) is not None
    with pytest.raises(HTTPException):
        await auth_mw.require_admin_or_super(DummyUser(RoleEnum.STUDENT))


@pytest.mark.asyncio
async def test_require_permissions_allows_when_permission_present(monkeypatch):
    """
    Cubre el return user (sin wildcard) cuando el permiso requerido está presente.
    """
    perm_dep = auth_mw.require_permissions(["content:write"])

    class U:
        def __init__(self):
            self.role = RoleEnum.ADMIN

    monkeypatch.setattr(auth_mw, "get_permissions_for_role", lambda role: ["content:write"])
    out = await perm_dep(U())
    assert out.role == RoleEnum.ADMIN


