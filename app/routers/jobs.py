"""Jobs: public search + recruiter CRUD on their own postings."""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from .. import db
from ..schemas import JobIn
from ..security import get_current_user, require_recruiter

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

_JOB_COLS = """j.job_id, j.recruiter_id, j.title, j.description, j.required_skills,
               j.qualification, j.min_experience_years, j.location,
               j.employment_type, j.is_active, j.created_at"""


@router.get("")
def list_jobs(
    search: str = Query(default=""),
    location: str = Query(default=""),
    skill: str = Query(default=""),
    active_only: bool = Query(default=True),
):
    """Public job search. Full-text search runs on the indexed columns."""
    clauses, params = [], []
    if active_only:
        clauses.append("j.is_active = TRUE")
    if search.strip():
        clauses.append(
            "(to_tsvector('english', j.title) @@ plainto_tsquery('english', %s) "
            "OR to_tsvector('english', COALESCE(j.required_skills,'')) "
            "@@ plainto_tsquery('english', %s))"
        )
        params += [search, search]
    if location.strip():
        clauses.append("j.location ILIKE %s")
        params.append(f"%{location.strip()}%")
    if skill.strip():
        clauses.append(
            "to_tsvector('english', COALESCE(j.required_skills,'')) "
            "@@ plainto_tsquery('english', %s)"
        )
        params.append(skill)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return db.fetch_all(
        f"""SELECT {_JOB_COLS}, u.name AS recruiter_name
            FROM jobs j JOIN users u ON u.user_id = j.recruiter_id
            {where}
            ORDER BY j.created_at DESC
            LIMIT 200""",
        params,
    )


@router.get("/mine")
def my_jobs(user: dict = Depends(require_recruiter)):
    return db.fetch_all(
        f"""SELECT {_JOB_COLS},
                   (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id)
                   AS application_count
            FROM jobs j WHERE j.recruiter_id = %s
            ORDER BY j.created_at DESC""",
        (user["user_id"],),
    )


@router.get("/{job_id}")
def get_job(job_id: int):
    job = db.fetch_one(
        f"""SELECT {_JOB_COLS}, u.name AS recruiter_name
            FROM jobs j JOIN users u ON u.user_id = j.recruiter_id
            WHERE j.job_id = %s""",
        (job_id,),
    )
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _owned_job(job_id: int, recruiter_id: int) -> dict:
    job = db.fetch_one(
        "SELECT * FROM jobs WHERE job_id = %s AND recruiter_id = %s",
        (job_id, recruiter_id),
    )
    if job is None:
        raise HTTPException(
            status_code=404, detail="Job not found or not yours"
        )
    return job


@router.post("", status_code=status.HTTP_201_CREATED)
def create_job(data: JobIn, user: dict = Depends(require_recruiter)):
    return db.execute_returning(
        """INSERT INTO jobs (recruiter_id, title, description, required_skills,
                             qualification, min_experience_years, location,
                             employment_type, is_active)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
           RETURNING job_id""",
        (
            user["user_id"], data.title.strip(), data.description,
            data.required_skills.strip().lower(), data.qualification,
            data.min_experience_years, data.location, data.employment_type,
            data.is_active,
        ),
    )


@router.put("/{job_id}")
def update_job(job_id: int, data: JobIn, user: dict = Depends(require_recruiter)):
    _owned_job(job_id, user["user_id"])
    db.execute(
        """UPDATE jobs SET title=%s, description=%s, required_skills=%s,
                          qualification=%s, min_experience_years=%s,
                          location=%s, employment_type=%s, is_active=%s
           WHERE job_id=%s""",
        (
            data.title.strip(), data.description,
            data.required_skills.strip().lower(), data.qualification,
            data.min_experience_years, data.location, data.employment_type,
            data.is_active, job_id,
        ),
    )
    return {"ok": True}


@router.delete("/{job_id}")
def delete_job(job_id: int, user: dict = Depends(require_recruiter)):
    _owned_job(job_id, user["user_id"])
    db.execute("DELETE FROM jobs WHERE job_id = %s", (job_id,))
    return {"ok": True}
