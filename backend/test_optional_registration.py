import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.main import app
from backend.database import Base, get_db
from backend.models import InviteCode


@pytest.fixture
def client():
    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)
    with session() as db:
        db.add(InviteCode(code='OPTIONAL-NAME-TEST', is_active=True))
        db.commit()
    def override():
        with session() as db:
            yield db
    app.dependency_overrides[get_db] = override
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)
        engine.dispose()


@pytest.mark.parametrize('optional', [{}, {'name': '  ', 'nickname': '  '}, {'nickname': 'Researcher'}, {'name': 'Real name', 'nickname': 'Alias'}])
def test_registration_without_required_name(client, optional):
    credentials = {'email': 'member@example.invalid', 'password': 'test-password'}
    response = client.post('/api/auth/register', json={**credentials, 'invite_code': 'OPTIONAL-NAME-TEST', **optional})
    assert response.status_code == 200, response.text
    data = response.json()
    user = data['user']
    assert user['real_name'] == optional.get('name', '').strip()
    if optional.get('nickname', '').strip():
        assert user['name'] == optional['nickname'].strip()
    else:
        assert user['name'].startswith('成员-')
    assert user['role'] == 'student'
    assert client.post('/api/auth/login', json=credentials).status_code == 200
    saved = client.put('/api/account/profile', headers={'Authorization': f"Bearer {data['access_token']}"}, json={'real_name': '', 'nickname': ''})
    assert saved.status_code == 200
    assert saved.json()['real_name'] == ''
    assert saved.json()['name']


def test_invitation_still_required(client):
    response = client.post('/api/auth/register', json={'email': 'member@example.invalid', 'password': 'test-password', 'invite_code': 'INVALID'})
    assert response.status_code == 400
