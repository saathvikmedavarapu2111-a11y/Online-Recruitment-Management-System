"""Applications: apply, track status, recruiter pipeline management."""
from fastapi import APIRouter, Depends, HTTPException, status

from .. import db
from ..schemas import ApplyIn, StatusIn
from ..security import get_current_user, require_applicant, require_recruiter

router = APIRouter(prefix="/api/applications", tags=["applications"])

_DETAIL_COLS = """a.application_id, a.status, a.applied_at,
                  j.job_id, j.title AS job_title, j.location AS job_location,
                  c.candidate_id, u.name AS candidate_name, u.email AS candidate_email,
                  c.skills AS candidate_skills,
                  c.experience_years AS candidate_experience,
                  ms.score AS match_score"""


def _detail_query(extra_where: str = "") -> str:
    where = f"AND {extra_where}" if extra_where else ""
    return f"""SELECT {_DETAIL_COLS}
               FROM applications a
               JOIN jobs j        ON j.job_id = a.job_id
               JOIN candidates c  ON c.candidate_id = a.candidate_id
               JOIN users u       ON u.user_id = c.user_id
               LEFT JOIN match_scores ms ON ms.application_id = a.application_id
               WHERE TRUE {where}"""


@router.post("", status_code=status.HTTP_201_CREATED)
def apply(data: ApplyIn, user: dict = Depends(require_applicant)):
    profile = db.fetch_one(
        "SELECT candidate_id FROM candidates WHERE user_id = %s", (user["user_id"],)
    )
    job = db.fetch_one(
        "SELECT job_id, is_active FROM jobs WHERE job_id = %s", (data.job_id,)
    )
    if job is None or not job["is_active"]:
        raise HTTPException(status_code=404, detail="Job not available")
    if db.fetch_one(
        "SELECT 1 FROM applications WHERE candidate_id = %s AND job_id = %s",
        (profile["candidate_id"], data.job_id),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job",
        )
    row = db.execute_returning(
        """INSERT INTO applications (candidate_id, job_id)
           VALUES (%s, %s) RETURNING application_id""",
        (profile["candidate_id"], data.job_id),
    )
    return {"application_id": row["application_id"], "status": "applied"}


@router.get("/me")
def my_applications(user: dict = Depends(require_applicant)):
    profile = db.fetch_one(
        "SELECT candidate_id FROM candidates WHERE user_id = %s", (user["user_id"],)
    )
    return db.fetch_all(
        _detail_query("a.candidate_id = %s") + " ORDER BY a.applied_at DESC",
        (profile["candidate_id"],),
    )


@router.get("/job/{job_id}")
def applications_for_job(job_id: int, user: dict = Depends(require_recruiter)):
    job = db.fetch_one(
        "SELECT job_id FROM jobs WHERE job_id = %s AND recruiter_id = %s",
        (job_id, user["user_id"]),
    )
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found or not yours")
    return db.fetch_all(
        _detail_query("a.job_id = %s")
        + " ORDER BY ms.score DESC NULLS LAST, a.applied_at DESC",
        (job_id,),
    )


@router.patch("/{application_id}/status")
def update_status(
    application_id: int, data: StatusIn, user: dict = Depends(require_recruiter)
):
    app = db.fetch_one(
        """SELECT a.application_id FROM applications a
           JOIN jobs j ON j.job_id = a.job_id
           WHERE a.application_id = %s AND j.recruiter_id = %s""",
        (application_id, user["user_id"]),
    )
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    db.execute(
        "UPDATE applications SET status = %s WHERE application_id = %s",
        (data.status, application_id),
    )
    return {"ok": True, "status": data.status}


@router.delete("/{application_id}")
def withdraw(application_id: int, user: dict = Depends(get_current_user)):
    """Applicants withdraw their own; recruiters can remove from their jobs."""
    if user["role"] == "applicant":
        profile = db.fetch_one(
            "SELECT candidate_id FROM candidates WHERE user_id = %s",
            (user["user_id"],),
        )
        app = db.fetch_one(
            "SELECT application_id FROM applications "
            "WHERE application_id = %s AND candidate_id = %s",
            (application_id, profile["candidate_id"]),
        )
    elif user["role"] == "recruiter":
        app = db.fetch_one(
            """SELECT a.application_id FROM applications a
               JOIN jobs j ON j.job_id = a.job_id
               WHERE a.application_id = %s AND j.recruiter_id = %s""",
            (application_id, user["user_id"]),
        )
    else:
        app = db.fetch_one(
            "SELECT application_id FROM applications WHERE application_id = %s",
            (application_id,),
        )
    if app is None:
        raise HTTPException(status_code=404, detail="Application not found")
    db.execute("DELETE FROM applications WHERE application_id = %s", (application_id,))
    return {"ok": True}
