import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.middlewares.auth import get_current_user, require_permissions, require_role
from app.models import RoleEnum


def test_require_role_allows_and_denies():
    app = FastAPI()

    class DummyUser:
        def __init__(self, role):
            self.role = role

    role_dep = require_role(["admin"])

    @app.get("/ok", dependencies=[Depends(role_dep)])
    async def ok():
        return {"ok": True}

    client = TestClient(app)

    # allowed
    app.dependency_overrides[get_current_user] = lambda: DummyUser(RoleEnum.ADMIN)
    assert client.get("/ok").status_code == 200

    # denied
    app.dependency_overrides[get_current_user] = lambda: DummyUser(RoleEnum.STUDENT)
    assert client.get("/ok").status_code == 403


def test_require_permissions_allows_wildcard(monkeypatch):
    app = FastAPI()

    class DummyUser:
        def __init__(self):
            self.role = RoleEnum.SUPER_ADMIN

    perm_dep = require_permissions(["content:write"])
    app.dependency_overrides[get_current_user] = lambda: DummyUser()
    monkeypatch.setattr("app.middlewares.auth.get_permissions_for_role", lambda role: ["*"])

    @app.get("/p", dependencies=[Depends(perm_dep)])
    async def p():
        return {"ok": True}

    client = TestClient(app)
    assert client.get("/p").status_code == 200


def test_require_permissions_denies_missing(monkeypatch):
    app = FastAPI()

    class DummyUser:
        def __init__(self):
            self.role = RoleEnum.ADMIN

    perm_dep = require_permissions(["content:write"])
    app.dependency_overrides[get_current_user] = lambda: DummyUser()
    monkeypatch.setattr("app.middlewares.auth.get_permissions_for_role", lambda role: ["users:read"])

    @app.get("/p", dependencies=[Depends(perm_dep)])
    async def p():
        return {"ok": True}

    client = TestClient(app)
    assert client.get("/p").status_code == 403


