"""Interviews: scheduling, feedback and results."""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from .. import db
from ..schemas import InterviewIn, InterviewUpdate
from ..security import get_current_user, require_applicant, require_recruiter

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

_COLS = """i.interview_id, i.application_id, i.scheduled_on, i.mode,
           i.interviewer, i.feedback, i.result,
           u.name AS candidate_name, j.title AS job_title"""


def _recruiter_application(application_id: int, recruiter_id: int) -> dict:
    app = db.fetch_one(
        """SELECT a.application_id FROM applications a
           JOIN jobs j ON j.job_id = a.job_id
           WHERE a.application_id = %s AND j.recruiter_id = %s""",
        (application_id, recruiter_id),
    )
    if app is None:
        raise HTTPException(
            status_code=404, detail="Application not found or not yours"
        )
    return app


@router.post("", status_code=status.HTTP_201_CREATED)
def schedule(data: InterviewIn, user: dict = Depends(require_recruiter)):
    _recruiter_application(data.application_id, user["user_id"])
    row = db.execute_returning(
        """INSERT INTO interviews (application_id, scheduled_on, mode, interviewer)
           VALUES (%s, %s, %s, %s)
           RETURNING interview_id""",
        (data.application_id, data.scheduled_on, data.mode, data.interviewer),
    )
    # Move the application into the interview stage automatically.
    db.execute(
        "UPDATE applications SET status = 'interview' WHERE application_id = %s",
        (data.application_id,),
    )
    return {"interview_id": row["interview_id"]}


@router.get("")
def list_interviews(
    application_id: int = Query(default=None),
    user: dict = Depends(require_recruiter),
):
    params: list = [user["user_id"]]
    extra = ""
    if application_id is not None:
        extra = "AND a.application_id = %s"
        params.append(application_id)
    return db.fetch_all(
        f"""SELECT {_COLS}
            FROM interviews i
            JOIN applications a ON a.application_id = i.application_id
            JOIN jobs j         ON j.job_id = a.job_id
            JOIN candidates c   ON c.candidate_id = a.candidate_id
            JOIN users u        ON u.user_id = c.user_id
            WHERE j.recruiter_id = %s {extra}
            ORDER BY i.scheduled_on DESC""",
        params,
    )


@router.get("/me")
def my_interviews(user: dict = Depends(require_applicant)):
    profile = db.fetch_one(
        "SELECT candidate_id FROM candidates WHERE user_id = %s", (user["user_id"],)
    )
    return db.fetch_all(
        f"""SELECT {_COLS}
            FROM interviews i
            JOIN applications a ON a.application_id = i.application_id
            JOIN jobs j         ON j.job_id = a.job_id
            JOIN candidates c   ON c.candidate_id = a.candidate_id
            JOIN users u        ON u.user_id = c.user_id
            WHERE a.candidate_id = %s
            ORDER BY i.scheduled_on DESC""",
        (profile["candidate_id"],),
    )


@router.patch("/{interview_id}")
def update_interview(
    interview_id: int, data: InterviewUpdate, user: dict = Depends(require_recruiter)
):
    row = db.fetch_one(
        """SELECT i.interview_id, a.application_id FROM interviews i
           JOIN applications a ON a.application_id = i.application_id
           JOIN jobs j ON j.job_id = a.job_id
           WHERE i.interview_id = %s AND j.recruiter_id = %s""",
        (interview_id, user["user_id"]),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    db.execute(
        """UPDATE interviews
           SET feedback = COALESCE(%s, feedback),
               result = COALESCE(%s, result),
               scheduled_on = COALESCE(%s, scheduled_on)
           WHERE interview_id = %s""",
        (data.feedback, data.result, data.scheduled_on, interview_id),
    )
    # Keep the pipeline status in sync with the outcome.
    if data.result == "selected":
        db.execute(
            "UPDATE applications SET status = 'offer' WHERE application_id = %s",
            (row["application_id"],),
        )
    elif data.result == "rejected":
        db.execute(
            "UPDATE applications SET status = 'rejected' WHERE application_id = %s",
            (row["application_id"],),
        )
    return {"ok": True}


@router.delete("/{interview_id}")
def delete_interview(interview_id: int, user: dict = Depends(require_recruiter)):
    row = db.fetch_one(
        """SELECT i.interview_id FROM interviews i
           JOIN applications a ON a.application_id = i.application_id
           JOIN jobs j ON j.job_id = a.job_id
           WHERE i.interview_id = %s AND j.recruiter_id = %s""",
        (interview_id, user["user_id"]),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    db.execute("DELETE FROM interviews WHERE interview_id = %s", (interview_id,))
    return {"ok": True}
