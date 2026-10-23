import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend.models import InviteCode
from backend.seed import (
    _configured_admin_password,
    _configured_invite_code,
    _seed_default_invite_codes,
    init_clean_db,
)


def test_invite_seeding_never_invents_a_default(monkeypatch):
    monkeypatch.delenv("LABHUB_INVITE_CODE", raising=False)
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    try:
        with Session() as db:
            _seed_default_invite_codes(db)
            assert db.query(InviteCode).count() == 0
    finally:
        engine.dispose()


def test_invite_code_requires_explicit_nonlegacy_configuration(monkeypatch):
    monkeypatch.delenv("LABHUB_INVITE_CODE", raising=False)
    assert _configured_invite_code() == ""
    with pytest.raises(RuntimeError, match="must be set"):
        _configured_invite_code(required=True)

    monkeypatch.setenv("LABHUB_INVITE_CODE", "LAB-2026")
    with pytest.raises(RuntimeError, match="legacy value"):
        _configured_invite_code(required=True)

    monkeypatch.setenv("LABHUB_INVITE_CODE", "short")
    with pytest.raises(RuntimeError, match="12 characters"):
        _configured_invite_code(required=True)

    monkeypatch.setenv("LABHUB_INVITE_CODE", "TEST-INVITE-2026")
    assert _configured_invite_code(required=True) == "TEST-INVITE-2026"


@pytest.mark.parametrize(
    ("password", "valid"),
    [
        ("a" * 11, False),
        ("é" * 5, False),   # 10 UTF-8 bytes
        ("é" * 6, True),    # 12 UTF-8 bytes, despite only six characters
        ("a" * 72, True),
        ("a" * 73, False),
        (" " * 12, False),
    ],
)
def test_admin_password_contract_uses_utf8_bytes(monkeypatch, password, valid):
    monkeypatch.setenv("ADMIN_PASSWORD", password)
    if valid:
        assert _configured_admin_password() == password
        assert 12 <= len(password.encode("utf-8")) <= 72
    else:
        with pytest.raises(RuntimeError, match="12–72 UTF-8 bytes"):
            _configured_admin_password()


def test_clean_db_requires_credentials_before_any_database_mutation(monkeypatch):
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    monkeypatch.setenv("LABHUB_INVITE_CODE", "TEST-INVITE-2026")

    def mutation_must_not_run(*args, **kwargs):
        raise AssertionError("database mutation ran before credential validation")

    monkeypatch.setattr(Base.metadata, "drop_all", mutation_must_not_run)
    with pytest.raises(RuntimeError, match="ADMIN_PASSWORD"):
        init_clean_db(reset=True)


def test_clean_db_rejects_legacy_invite_before_any_database_mutation(monkeypatch):
    monkeypatch.setenv("ADMIN_PASSWORD", "test-only-admin-password-2026")
    monkeypatch.setenv("LABHUB_INVITE_CODE", "LAB-2026")

    def mutation_must_not_run(*args, **kwargs):
        raise AssertionError("database mutation ran before invite validation")

    monkeypatch.setattr(Base.metadata, "drop_all", mutation_must_not_run)
    with pytest.raises(RuntimeError, match="legacy value"):
        init_clean_db(reset=True)
