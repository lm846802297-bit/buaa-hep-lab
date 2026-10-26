import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.auth import create_access_token
from backend.database import Base, get_db
from backend.main import app
from backend.models import Notice, User


@pytest.fixture
def notice_client(monkeypatch):
    monkeypatch.setattr('backend.auth.SECRET_KEY', 'notice-test-secret-at-least-32-characters')
    engine = create_engine(
        'sqlite:///:memory:',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    with Session() as db:
        users = [
            User(id=1, name='Owner Student', email='owner@example.invalid', hashed_password='unused', role='student'),
            User(id=2, name='Other Student', email='other@example.invalid', hashed_password='unused', role='student'),
            User(id=3, name='Teacher', email='teacher@example.invalid', hashed_password='unused', role='teacher'),
            User(id=4, name='Administrator', email='admin@example.invalid', hashed_password='unused', role='admin'),
        ]
        db.add_all(users)
        db.flush()
        db.add(Notice(
            id=1,
            title='Original notice',
            content='Original content',
            created_by_id=1,
            created_by_name='Owner Student',
        ))
        db.commit()
        tokens = [
            create_access_token({'sub': user.id, 'ver': user.token_version})
            for user in users
        ]

    def override_get_db():
        with Session() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        yield TestClient(app), tokens
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


@pytest.mark.parametrize(
    ('actor_index', 'method', 'expected_status'),
    [
        (0, 'PUT', 200),  # The owner may edit their own notice.
        (0, 'DELETE', 200),
        (1, 'PUT', 403),  # Another ordinary member may not edit/delete it.
        (1, 'DELETE', 403),
        (2, 'PUT', 200),  # Teachers may manage notices.
        (2, 'DELETE', 200),
        (3, 'PUT', 200),  # Administrators may manage notices.
        (3, 'DELETE', 200),
    ],
)
def test_notice_edit_delete_role_matrix(notice_client, actor_index, method, expected_status):
    client, tokens = notice_client
    kwargs = {'headers': {'Authorization': f'Bearer {tokens[actor_index]}'}}
    if method == 'PUT':
        kwargs['json'] = {'title': 'Updated notice'}
    response = client.request(method, '/api/notices/1', **kwargs)
    assert response.status_code == expected_status, response.text
