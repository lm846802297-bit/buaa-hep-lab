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
def clear_auth_rate_limits_between_tests():
    """Keep persistent rate-limit protection intact within each test, but isolate tests from one another."""
    from sqlalchemy import text
    from backend.database import engine

    def clear_limits():
        with engine.begin() as connection:
            exists = connection.execute(text(
                "SELECT 1 FROM sqlite_master WHERE type='table' AND name='auth_rate_limits'"
            )).first()
            if exists:
                connection.execute(text("DELETE FROM auth_rate_limits"))

    clear_limits()
    yield
    clear_limits()
