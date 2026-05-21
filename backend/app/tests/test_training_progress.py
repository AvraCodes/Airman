from app.db.models import Role

def test_instructor_can_submit_training_progress(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    # Transition to LANDED so training record can be created
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)
    client.patch("/sorties/1/landed", headers=disp_headers)

    inst_headers = auth_headers(4, Role.INSTRUCTOR)
    c = client.post(
        "/training-progress",
        json={
            "sortie_id": 1,
            "cadet_id": 3,
            "instructor_id": 4,
            "lesson_type": "Circuit",
            "maneuver_score": 4,
            "communication_score": 4,
            "situational_awareness_score": 4,
            "remarks": "Good remarks here"
        },
        headers=inst_headers,
    )
    assert c.status_code == 201
    s = client.patch("/training-progress/1/submit", headers=inst_headers)
    assert s.status_code == 200


def test_cadet_cannot_submit_training_progress(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)
    client.patch("/sorties/1/landed", headers=disp_headers)

    cadet_headers = auth_headers(3, Role.CADET)
    c = client.post(
        "/training-progress",
        json={
            "sortie_id": 1,
            "cadet_id": 3,
            "instructor_id": 4,
            "lesson_type": "Circuit",
            "maneuver_score": 4,
            "communication_score": 4,
            "situational_awareness_score": 4,
            "remarks": "Good"
        },
        headers=cadet_headers,
    )
    assert c.status_code == 403


def test_cfi_can_approve_training_progress(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)
    client.patch("/sorties/1/landed", headers=disp_headers)

    inst_headers = auth_headers(4, Role.INSTRUCTOR)
    client.post(
        "/training-progress",
        json={
            "sortie_id": 1,
            "cadet_id": 3,
            "instructor_id": 4,
            "lesson_type": "Circuit",
            "maneuver_score": 4,
            "communication_score": 4,
            "situational_awareness_score": 4,
            "remarks": "Good remarks here"
        },
        headers=inst_headers,
    )
    client.patch("/training-progress/1/submit", headers=inst_headers)
    
    cfi_headers = auth_headers(5, Role.CFI)
    r = client.patch("/training-progress/1/approve", headers=cfi_headers)
    assert r.status_code == 200


def test_aircraft_becomes_grounded_when_defect_reported(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    # Transition to AIRBORNE/LANDED so defect can be reported for a sortie
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)

    mo_headers = auth_headers(6, Role.MAINTENANCE_OFFICER)
    r = client.post(
        "/defects",
        json={"aircraft_id": 1, "sortie_id": 1, "severity": "HIGH", "description": "Oil pressure low"},
        headers=mo_headers,
    )
    assert r.status_code == 201
    a = client.get("/aircraft/1", headers=mo_headers)
    assert a.json()["status"] == "GROUNDED"

