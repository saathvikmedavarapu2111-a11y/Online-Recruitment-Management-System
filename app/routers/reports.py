"""Reports & analytics: recruitment funnels and system overviews."""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..security import require_admin, require_recruiter

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/overview")
def recruiter_overview(user: dict = Depends(require_recruiter)):
    rid = user["user_id"]
    jobs = db.fetch_one(
        "SELECT COUNT(*) AS n FROM jobs WHERE recruiter_id = %s", (rid,)
    )["n"]
    apps = db.fetch_one(
        """SELECT COUNT(*) AS n FROM applications a
           JOIN jobs j ON j.job_id = a.job_id WHERE j.recruiter_id = %s""",
        (rid,),
    )["n"]
    interviews = db.fetch_one(
        """SELECT COUNT(*) AS n FROM interviews i
           JOIN applications a ON a.application_id = i.application_id
           JOIN jobs j ON j.job_id = a.job_id WHERE j.recruiter_id = %s""",
        (rid,),
    )["n"]
    avg_score = db.fetch_one(
        """SELECT ROUND(AVG(ms.score), 2) AS avg FROM match_scores ms
           JOIN applications a ON a.application_id = ms.application_id
           JOIN jobs j ON j.job_id = a.job_id WHERE j.recruiter_id = %s""",
        (rid,),
    )["avg"]
    funnel = db.fetch_all(
        """SELECT a.status, COUNT(*) AS n FROM applications a
           JOIN jobs j ON j.job_id = a.job_id
           WHERE j.recruiter_id = %s GROUP BY a.status""",
        (rid,),
    )
    return {
        "jobs_posted": jobs,
        "applications_received": apps,
        "interviews_scheduled": interviews,
        "average_match_score": float(avg_score) if avg_score is not None else None,
        "funnel": {row["status"]: row["n"] for row in funnel},
    }


@router.get("/job/{job_id}/funnel")
def job_funnel(job_id: int, user: dict = Depends(require_recruiter)):
    job = db.fetch_one(
        "SELECT job_id, title FROM jobs WHERE job_id = %s AND recruiter_id = %s",
        (job_id, user["user_id"]),
    )
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or not yours")
    funnel = db.fetch_all(
        "SELECT status, COUNT(*) AS n FROM applications "
        "WHERE job_id = %s GROUP BY status",
        (job_id,),
    )
    top = db.fetch_all(
        """SELECT u.name AS candidate_name, ms.score
           FROM match_scores ms
           JOIN applications a ON a.application_id = ms.application_id
           JOIN candidates c ON c.candidate_id = a.candidate_id
           JOIN users u ON u.user_id = c.user_id
           WHERE a.job_id = %s ORDER BY ms.score DESC LIMIT 5""",
        (job_id,),
    )
    return {
        "job_id": job_id,
        "title": job["title"],
        "funnel": {row["status"]: row["n"] for row in funnel},
        "top_candidates": [
            {"name": r["candidate_name"], "score": float(r["score"])} for r in top
        ],
    }


@router.get("/admin/overview")
def admin_overview(user: dict = Depends(require_admin)):
    counts = {}
    for label, table in [
        ("users", "users"),
        ("candidates", "candidates"),
        ("jobs", "jobs"),
        ("applications", "applications"),
        ("interviews", "interviews"),
    ]:
        counts[label] = db.fetch_one(f"SELECT COUNT(*) AS n FROM {table}")["n"]
    by_role = db.fetch_all("SELECT role, COUNT(*) AS n FROM users GROUP BY role")
    by_status = db.fetch_all(
        "SELECT status, COUNT(*) AS n FROM applications GROUP BY status"
    )
    return {
        "counts": counts,
        "users_by_role": {r["role"]: r["n"] for r in by_role},
        "applications_by_status": {r["status"]: r["n"] for r in by_status},
    }
