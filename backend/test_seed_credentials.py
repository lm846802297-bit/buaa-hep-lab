import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend.models import InviteCode
from backend.seed import _configured_invite_code, _seed_default_invite_codes, init_clean_db


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


def test_clean_db_requires_explicit_strong_admin_password_before_mutation(monkeypatch):
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    monkeypatch.setenv("LABHUB_INVITE_CODE", "TEST-INVITE-2026")
    with pytest.raises(RuntimeError, match="ADMIN_PASSWORD"):
        init_clean_db(reset=True)


def test_clean_db_rejects_legacy_invite_before_mutation(monkeypatch):
    monkeypatch.setenv("ADMIN_PASSWORD", "test-only-admin-password-2026")
    monkeypatch.setenv("LABHUB_INVITE_CODE", "LAB-2026")
    with pytest.raises(RuntimeError, match="legacy value"):
        init_clean_db(reset=True)
