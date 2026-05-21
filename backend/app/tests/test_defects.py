from app.db.models import Role

def test_report_defect_grounds_aircraft(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    # Transition to AIRBORNE
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)

    mo_headers = auth_headers(6, Role.MAINTENANCE_OFFICER)
    r = client.post(
        "/defects",
        json={"aircraft_id": 1, "sortie_id": 1, "severity": "MEDIUM", "description": "Hydraulic leak detected"},
        headers=mo_headers,
    )
    assert r.status_code == 201
    defect = r.json()
    assert defect["status"] == "OPEN"
    assert defect["severity"] == "MEDIUM"

    # Verify aircraft is now GROUNDED
    a = client.get("/aircraft/1", headers=mo_headers)
    assert a.json()["status"] == "GROUNDED"

    # Verify sortie is now RECOVERY_REQUIRED
    s = client.get("/sorties/1", headers=mo_headers)
    assert s.json()["status"] == "RECOVERY_REQUIRED"


def test_cadet_cannot_report_defect(client, auth_headers):
    cadet_headers = auth_headers(3, Role.CADET)
    r = client.post(
        "/defects",
        json={"aircraft_id": 1, "sortie_id": 1, "severity": "MEDIUM", "description": "Seat belt torn"},
        headers=cadet_headers,
    )
    assert r.status_code == 403


def test_resolve_defect_successful(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    # Transition sortie to AIRBORNE
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)

    mo_headers = auth_headers(6, Role.MAINTENANCE_OFFICER)
    # Report a defect
    r = client.post(
        "/defects",
        json={"aircraft_id": 1, "sortie_id": 1, "severity": "MEDIUM", "description": "Hydraulic leak detected"},
        headers=mo_headers,
    )
    assert r.status_code == 201
    defect_id = r.json()["id"]

    # Verify sortie is in RECOVERY_REQUIRED
    s = client.get("/sorties/1", headers=mo_headers)
    assert s.json()["status"] == "RECOVERY_REQUIRED"

    # Resolve the defect
    resolve = client.patch(
        f"/defects/{defect_id}/resolve",
        json={"recovery_decision": "Replaced the hydraulic seal and tested."},
        headers=mo_headers,
    )
    assert resolve.status_code == 200
    assert resolve.json()["status"] == "RESOLVED"
    assert resolve.json()["recovery_decision"] == "Replaced the hydraulic seal and tested."

    # Verify sortie is recovered to LANDED status
    s2 = client.get("/sorties/1", headers=mo_headers)
    assert s2.json()["status"] == "LANDED"

    # Verify aircraft remains GROUNDED (needs explicit /ready release)
    a = client.get("/aircraft/1", headers=mo_headers)
    assert a.json()["status"] == "GROUNDED"

    # Release aircraft to ready now that defect is resolved
    ready = client.patch(f"/aircraft/1/ready", headers=mo_headers)
    assert ready.status_code == 200
    assert ready.json()["status"] == "READY"


def test_non_mo_cannot_resolve_defect(client, auth_headers):
    disp_headers = auth_headers(2, Role.DISPATCHER)
    client.patch("/sorties/1/release", headers=disp_headers)
    client.patch("/sorties/1/airborne", headers=disp_headers)

    mo_headers = auth_headers(6, Role.MAINTENANCE_OFFICER)
    r = client.post(
        "/defects",
        json={"aircraft_id": 1, "sortie_id": 1, "severity": "MEDIUM", "description": "Hydraulic leak detected"},
        headers=mo_headers,
    )
    defect_id = r.json()["id"]

    # Dispatcher cannot resolve defect
    resolve = client.patch(
        f"/defects/{defect_id}/resolve",
        json={"recovery_decision": "Replaced the hydraulic seal and tested."},
        headers=disp_headers,
    )
    assert resolve.status_code == 403
