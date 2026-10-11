"""End-to-end API tests — needs a PostgreSQL database.

The suite creates its own throwaway tables? No — it runs against the
database in TEST_DATABASE_URL (or DATABASE_URL) and cleans up the rows
it creates, so run it against a scratch database, not production.

Run:  TEST_DATABASE_URL=postgresql://... pytest tests/test_api.py -v
Skips automatically when no database is reachable.
"""
import os
import uuid

import pytest

TEST_DB = os.environ.get(
    "TEST_DATABASE_URL", os.environ.get("DATABASE_URL", "")
)


def _db_reachable() -> bool:
    if not TEST_DB:
        return False
    try:
        import psycopg

        with psycopg.connect(TEST_DB, connect_timeout=3) as c:
            c.execute("SELECT 1")
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _db_reachable(), reason="no PostgreSQL reachable (set TEST_DATABASE_URL)"
)

os.environ["DATABASE_URL"] = TEST_DB
os.environ.setdefault("JWT_SECRET", "test-secret")

from fastapi.testclient import TestClient  # noqa: E402

from app import db  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)
suffix = uuid.uuid4().hex[:8]
APPLICANT_EMAIL = f"test_applicant_{suffix}@example.com"
RECRUITER_EMAIL = f"test_recruiter_{suffix}@example.com"
PASSWORD = "password123"

state = {}


def _auth(email, password=PASSWORD):
    r = client.post(
        "/api/auth/login", json={"email": email, "password": password}
    )
    assert r.status_code == 200, r.text
    return {"Authorization": "Bearer " + r.json()["access_token"]}


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["database"] == "connected"


def test_register_and_login():
    for email, role in [(APPLICANT_EMAIL, "applicant"),
                        (RECRUITER_EMAIL, "recruiter")]:
        r = client.post(
            "/api/auth/register",
            json={"name": "Test User", "email": email,
                  "password": PASSWORD, "role": role},
        )
        assert r.status_code == 201, r.text
    # duplicate email rejected
    r = client.post(
        "/api/auth/register",
        json={"name": "Dup", "email": APPLICANT_EMAIL,
              "password": PASSWORD, "role": "applicant"},
    )
    assert r.status_code == 400
    # wrong password rejected
    r = client.post(
        "/api/auth/login", json={"email": APPLICANT_EMAIL, "password": "nope"}
    )
    assert r.status_code == 401


def test_recruiter_posts_job():
    h = _auth(RECRUITER_EMAIL)
    r = client.post(
        "/api/jobs",
        json={
            "title": f"Test Backend Dev {suffix}",
            "description": "test",
            "required_skills": "python, postgresql",
            "qualification": "B.Tech",
            "min_experience_years": 1,
            "location": "Remote",
        },
        headers=h,
    )
    assert r.status_code == 201, r.text
    state["job_id"] = r.json()["job_id"]


def test_applicant_profile_and_apply():
    h = _auth(APPLICANT_EMAIL)
    r = client.put(
        "/api/applicants/me",
        json={"skills": "python, postgresql, django",
              "experience_years": 2,
              "qualification": "B.Tech Computer Science"},
        headers=h,
    )
    assert r.status_code == 200
    r = client.post(
        "/api/applications", json={"job_id": state["job_id"]}, headers=h
    )
    assert r.status_code == 201, r.text
    state["application_id"] = r.json()["application_id"]
    # applying twice is rejected
    r = client.post(
        "/api/applications", json={"job_id": state["job_id"]}, headers=h
    )
    assert r.status_code == 400


def test_screening_scores_and_ranks():
    h = _auth(RECRUITER_EMAIL)
    r = client.post(
        f"/api/screening/job/{state['job_id']}/run", headers=h
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["scored"] == 1
    top = body["ranking"][0]
    # strict: no resume -> both skills are profile claims (0.6 each)
    # 100*(0.65*0.6 + 0.20*1 + 0.15*1) = 74.0
    assert top["score"] == 74.0, top
    assert "python" in (top["matched_skills"] or "")
    # GET returns the stored ranking plus live per-skill evidence
    r = client.get(f"/api/screening/job/{state['job_id']}", headers=h)
    assert r.status_code == 200
    ev = {e["skill"]: e["status"]
          for e in r.json()[0]["skill_evidence"]}
    assert ev == {"python": "claimed", "postgresql": "claimed"}


def test_status_update_and_interview():
    h = _auth(RECRUITER_EMAIL)
    r = client.patch(
        f"/api/applications/{state['application_id']}/status",
        json={"status": "interview"},
        headers=h,
    )
    assert r.status_code == 200
    r = client.post(
        "/api/interviews",
        json={
            "application_id": state["application_id"],
            "scheduled_on": "2030-01-15T10:00:00Z",
            "mode": "online",
            "interviewer": "Tester",
        },
        headers=h,
    )
    assert r.status_code == 201, r.text
    # applicant can see the interview
    ha = _auth(APPLICANT_EMAIL)
    r = client.get("/api/interviews/me", headers=ha)
    assert r.status_code == 200 and len(r.json()) == 1


def test_interview_proposal_flow():
    ha = _auth(APPLICANT_EMAIL)
    h = _auth(RECRUITER_EMAIL)
    # clear the interview scheduled by the previous test for this application
    r = client.get("/api/interviews",
                   params={"application_id": state["application_id"]}, headers=h)
    for iv in r.json():
        client.delete(f"/api/interviews/{iv['interview_id']}", headers=h)
    # applicant proposes a slot for the approved (interview-stage) application
    r = client.post(
        "/api/interviews/propose",
        json={
            "application_id": state["application_id"],
            "scheduled_on": "2030-02-01T11:00:00Z",
            "mode": "online",
            "message": "Morning works best for me",
        },
        headers=ha,
    )
    assert r.status_code == 201, r.text
    assert r.json()["status"] == "proposed"
    pid = r.json()["interview_id"]
    # duplicate proposal is rejected
    r = client.post(
        "/api/interviews/propose",
        json={"application_id": state["application_id"],
              "scheduled_on": "2030-02-02T11:00:00Z",
              "mode": "online"},
        headers=ha,
    )
    assert r.status_code == 409
    # recruiter sees the proposal
    r = client.get("/api/interviews", params={"status": "proposed"}, headers=h)
    assert r.status_code == 200
    assert any(i["interview_id"] == pid and i["message"] == "Morning works best for me"
               for i in r.json())
    # recruiter accepts it -> scheduled
    r = client.patch(f"/api/interviews/{pid}/respond",
                     json={"action": "accept"}, headers=h)
    assert r.status_code == 200 and r.json()["status"] == "scheduled"
    # accepting twice is rejected
    r = client.patch(f"/api/interviews/{pid}/respond",
                     json={"action": "decline"}, headers=h)
    assert r.status_code == 409
    # applicant cannot use the recruiter-only respond endpoint
    r = client.patch(f"/api/interviews/{pid}/respond",
                     json={"action": "accept"}, headers=ha)
    assert r.status_code == 403


def test_applicant_cannot_reach_recruiter_routes():
    ha = _auth(APPLICANT_EMAIL)
    r = client.post(
        "/api/jobs",
        json={"title": "x", "required_skills": "y"},
        headers=ha,
    )
    assert r.status_code == 403
    r = client.get("/api/jobs/mine", headers=ha)
    assert r.status_code == 403


def test_search_uses_index():
    r = client.get("/api/jobs", params={"skill": "postgresql"})
    assert r.status_code == 200
    assert any("postgresql" in j["required_skills"] for j in r.json())


def test_cleanup():
    # remove everything this suite created (jobs cascade to
    # applications, interviews and scores)
    db.execute(
        "DELETE FROM users WHERE email IN (%s, %s)",
        (APPLICANT_EMAIL, RECRUITER_EMAIL),
    )
