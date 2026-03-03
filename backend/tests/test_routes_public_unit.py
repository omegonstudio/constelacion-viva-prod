import pytest

from app.routes import public as public_routes


class FakeResult:
    def __init__(self, items):
        self._items = items

    def scalars(self):
        return self

    def all(self):
        return self._items


class FakeDB:
    def __init__(self, items):
        self.items = items
        self.executed = 0

    async def execute(self, query):
        self.executed += 1
        return FakeResult(self.items)


@pytest.mark.asyncio
async def test_public_list_gallery_unit_executes_query():
    db = FakeDB(items=[{"id": 1}])
    out = await public_routes.list_gallery(db=db)
    assert db.executed == 1
    assert out == [{"id": 1}]


