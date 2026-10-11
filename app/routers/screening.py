"""AI screening: score every applicant for a job and rank them.

POST /api/screening/job/{job_id}/run
    Re-scores all applications for one of the recruiter's jobs and stores
    the results in `match_scores`. Returns the ranked list.

GET /api/screening/job/{job_id}
    Returns the stored ranking (re-runs nothing).
"""
from fastapi import APIRouter, Depends, HTTPException

from .. import db
from ..ai.matcher import score_candidate, skill_evidence
from ..ai.skills import split_skills
from ..security import require_recruiter

router = APIRouter(prefix="/api/screening", tags=["screening"])


def _owned_job(job_id: int, recruiter_id: int) -> dict:
    job = db.fetch_one(
        "SELECT * FROM jobs WHERE job_id = %s AND recruiter_id = %s",
        (job_id, recruiter_id),
    )
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or not yours")
    return job


def _ranked(job_id: int) -> list[dict]:
    rows = db.fetch_all(
        """SELECT a.application_id, u.name AS candidate_name, u.email,
                  c.skills AS candidate_skills, c.resume_text,
                  c.experience_years AS candidate_experience,
                  c.qualification AS candidate_qualification,
                  ms.score, ms.matched_skills, ms.missing_skills, ms.ranked_on,
                  a.status
           FROM applications a
           JOIN candidates c ON c.candidate_id = a.candidate_id
           JOIN users u ON u.user_id = c.user_id
           LEFT JOIN match_scores ms ON ms.application_id = a.application_id
           WHERE a.job_id = %s
           ORDER BY ms.score DESC NULLS LAST, a.applied_at ASC""",
        (job_id,),
    )
    job = db.fetch_one(
        "SELECT required_skills FROM jobs WHERE job_id = %s", (job_id,)
    )
    req = split_skills((job or {}).get("required_skills"))
    for r in rows:
        # Evidence is recomputed live — deterministic, no extra column needed.
        r["skill_evidence"] = skill_evidence(
            {"skills": r.pop("candidate_skills"), "resume_text": r.pop("resume_text")},
            req,
        )
    return rows


@router.post("/job/{job_id}/run")
def run_screening(job_id: int, user: dict = Depends(require_recruiter)):
    job = _owned_job(job_id, user["user_id"])
    applications = db.fetch_all(
        """SELECT a.application_id, c.skills, c.resume_text,
                  c.experience_years, c.qualification
           FROM applications a
           JOIN candidates c ON c.candidate_id = a.candidate_id
           WHERE a.job_id = %s""",
        (job_id,),
    )
    for app in applications:
        result = score_candidate(
            {
                "skills": app["skills"],
                "resume_text": app["resume_text"],
                "experience_years": app["experience_years"],
                "qualification": app["qualification"],
            },
            {
                "required_skills": job["required_skills"],
                "min_experience_years": job["min_experience_years"],
                "qualification": job["qualification"],
            },
        )
        db.execute(
            """INSERT INTO match_scores
                   (application_id, score, matched_skills, missing_skills, ranked_on)
               VALUES (%s, %s, %s, %s, NOW())
               ON CONFLICT (application_id) DO UPDATE SET
                   score = EXCLUDED.score,
                   matched_skills = EXCLUDED.matched_skills,
                   missing_skills = EXCLUDED.missing_skills,
                   ranked_on = NOW()""",
            (
                app["application_id"],
                result["score"],
                ", ".join(result["matched_skills"]) or None,
                ", ".join(result["missing_skills"]) or None,
            ),
        )
        db.execute(
            """UPDATE applications SET status = 'screening'
               WHERE application_id = %s AND status = 'applied'""",
            (app["application_id"],),
        )
    return {"job_id": job_id, "scored": len(applications), "ranking": _ranked(job_id)}


@router.get("/job/{job_id}")
def get_ranking(job_id: int, user: dict = Depends(require_recruiter)):
    _owned_job(job_id, user["user_id"])
    return _ranked(job_id)
