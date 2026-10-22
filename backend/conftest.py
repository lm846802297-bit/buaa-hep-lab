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
def reset_auth_rate_limit_state():
    """Rate-limit state persists in the session DB; isolate it between tests.

    The dedicated throttle regression test still exercises multiple attempts
    within one test. This fixture only prevents unrelated tests sharing the
    same TestClient host/IP from exhausting each other's login budget.
    """
    from backend.database import engine

    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE IF NOT EXISTS auth_rate_limits "
            "(key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset_at INTEGER NOT NULL)"
        )
        connection.exec_driver_sql("DELETE FROM auth_rate_limits")
    yield
