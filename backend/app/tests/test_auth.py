from app.db.models import Role

def test_login_successful(client):
    r = client.post(
        "/auth/login",
        json={"email": "dispatcher@x.com", "password": "dispatcher"}
    )
    assert r.status_code == 200
    res = r.json()
    assert "access_token" in res
    assert res["token_type"] == "bearer"
    assert res["user"]["email"] == "dispatcher@x.com"
    assert res["user"]["role"] == "DISPATCHER"


def test_login_invalid_password(client):
    r = client.post(
        "/auth/login",
        json={"email": "dispatcher@x.com", "password": "wrong_password"}
    )
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_login_invalid_email(client):
    r = client.post(
        "/auth/login",
        json={"email": "nonexistent@x.com", "password": "password"}
    )
    assert r.status_code == 401
    assert r.json()["detail"] == "Invalid email or password"


def test_get_me_successful(client, auth_headers):
    headers = auth_headers(2, Role.DISPATCHER)
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "dispatcher@x.com"
    assert r.json()["role"] == "DISPATCHER"


def test_get_me_unauthorized(client):
    r = client.get("/auth/me")
    assert r.status_code == 401
