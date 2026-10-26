"""All API tests use their own database, including the existing demo-user tests."""
import os
import tempfile
import pytest

os.environ["SEED_DEMO_DATA"] = "1"
_test_database = tempfile.TemporaryDirectory(prefix="labhub-pytest-")
os.environ["LABHUB_DB_PATH"] = os.path.join(_test_database.name, "test.db")


@pytest.fixture(scope="session", autouse=True)
def isolated_database():
    from backend.seed import init_db
    from backend.database import engine
    init_db()
    yield
    engine.dispose()
    _test_database.cleanup()


@pytest.fixture(autouse=True)
def clear_shared_login_rate_limits():
    """Keep login throttling isolated between tests sharing the session DB."""
    from sqlalchemy import inspect, text
    from backend.database import engine

    if inspect(engine).has_table("auth_rate_limits"):
        with engine.begin() as db:
            db.execute(text("DELETE FROM auth_rate_limits"))
