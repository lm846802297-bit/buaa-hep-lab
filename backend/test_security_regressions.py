import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.main import app
from backend.database import Base, get_db
from backend.models import User, ResourceBook, SeminarSchedule
from backend.auth import create_access_token, get_password_hash
from backend.login_protection import protect_attempt


@pytest.fixture
def security_client(monkeypatch):
    monkeypatch.setattr('backend.auth.SECRET_KEY', 'isolated-security-test-key-at-least-32-characters')
    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)
    password = get_password_hash('test-password')
    with session() as db:
        for i, role in enumerate(['student', 'student', 'admin', 'teacher']):
            db.add(User(id=i + 1, name=f'Member {i + 1}', email=f'member{i + 1}@example.invalid', hashed_password=password, role=role))
        db.flush()
        db.add(ResourceBook(id=1, title='Original', authors='Author', category='教材', created_by_id=1))
        db.add(ResourceBook(id=2, title='Unowned', authors='Author', category='教材', created_by_id=None))
        db.commit()
    def override():
        with session() as db:
            yield db
    app.dependency_overrides[get_db] = override
    tokens = [create_access_token({'sub': i, 'ver': 0}) for i in range(1, 5)]
    headers = [{'Authorization': f'Bearer {token}'} for token in tokens]
    try:
        yield TestClient(app), headers, session
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


@pytest.mark.parametrize('actor,expected', [(0, 200), (1, 403), (2, 200), (3, 403)])
def test_resource_owner_and_admin_only(security_client, actor, expected):
    client, headers, session = security_client
    response = client.put('/api/resources/books/1', headers=headers[actor], json={'title': 'Changed', 'authors': 'Author', 'category': '教材'})
    assert response.status_code == expected, response.text
    response = client.delete('/api/resources/books/1', headers=headers[actor])
    assert response.status_code == expected, response.text


def test_unowned_resource_requires_admin(security_client):
    client, headers, _ = security_client
    body = {'title': 'Changed', 'authors': 'Author', 'category': '教材'}
    assert client.put('/api/resources/books/2', headers=headers[0], json=body).status_code == 403
    assert client.put('/api/resources/books/2', headers=headers[2], json=body).status_code == 200


def test_password_change_revokes_all_old_tokens(security_client):
    client, headers, _ = security_client
    response = client.put('/api/account/credentials', headers=headers[0], json={'current_password': 'test-password', 'new_password': 'changed-password'})
    assert response.status_code == 200, response.text
    for path in ['/api/auth/me', '/api/resources/books', '/api/mailbox/sync-stream']:
        assert client.get(path, headers=headers[0]).status_code == 401
    token = response.json()['access_token']
    fresh = {'Authorization': f'Bearer {token}'}
    assert client.get('/api/auth/me', headers=fresh).status_code == 200
    assert client.get('/api/mailbox/sync-stream', headers=fresh).status_code == 400
    assert client.get('/api/mailbox/sync-stream', params={'token': token}).status_code == 401


def test_login_failure_throttle_and_expiry(security_client):
    client, _, session = security_client
    for _ in range(10):
        assert client.post('/api/auth/login', json={'email': ' MEMBER1@example.invalid ', 'password': 'wrong-password'}).status_code == 401
    response = client.post('/api/auth/login', json={'email': 'member1@example.invalid', 'password': 'test-password'})
    assert response.status_code == 429
    assert int(response.headers['Retry-After']) > 0
    with session() as db:
        protect_attempt(db, 'test', 'same-id', 1, now=0)
        with pytest.raises(Exception) as error:
            protect_attempt(db, 'test', 'same-id', 1, now=1)
        assert error.value.status_code == 429
        protect_attempt(db, 'test', 'same-id', 1, now=900)


def test_no_default_signing_key(security_client, monkeypatch):
    client, headers, _ = security_client
    monkeypatch.setattr('backend.auth.SECRET_KEY', '')
    assert client.get('/api/auth/me', headers=headers[0]).status_code == 503
