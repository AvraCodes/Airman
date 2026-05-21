from app.db.models import Role

def test_dispatcher_can_release_scheduled_sortie(client, auth_headers):
    headers = auth_headers(2, Role.DISPATCHER)
    r = client.patch("/sorties/1/release", headers=headers)
    assert r.status_code == 200
    assert r.json()["status"] == "RELEASED"


def test_cadet_cannot_release_sortie(client, auth_headers):
    headers = auth_headers(3, Role.CADET)
    r = client.patch("/sorties/1/release", headers=headers)
    assert r.status_code == 403


def test_cannot_mark_scheduled_sortie_airborne_directly(client, auth_headers):
    headers = auth_headers(2, Role.DISPATCHER)
    r = client.patch("/sorties/1/airborne", headers=headers)
    assert r.status_code == 400


def test_grounded_aircraft_cannot_be_released(client, auth_headers):
    headers = auth_headers(2, Role.DISPATCHER)
    create = client.post(
        "/sorties",
        json={
            "sortie_number": "SRT-002",
            "cadet_id": 3,
            "instructor_id": 4,
            "aircraft_id": 2,
            "base_id": 1,
            "lesson_type": "Nav",
            "scheduled_start": "2026-05-19T10:00:00",
            "scheduled_end": "2026-05-19T11:00:00"
        },
        headers=headers,
    )
    assert create.status_code == 400


def test_sortie_cannot_close_before_cfi_approval(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    cfi_headers = auth_headers(5, Role.CFI)
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)
    client.patch("/sorties/1/landed", headers=disp_headers)
    r = client.patch("/sorties/1/close", headers=cfi_headers)
    assert r.status_code == 400


def test_audit_log_created_for_release(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    client.patch("/sorties/1/release", headers=disp_headers)
    logs = client.get("/audit-logs", headers=disp_headers)
    assert logs.status_code == 200
    assert any(l["action"] == "SORTIE_RELEASED" for l in logs.json())

