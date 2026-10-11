"""Interviews: scheduling, feedback and results."""
from fastapi import APIRouter, Depends, HTTPException, Query, status

from .. import db
from ..schemas import InterviewIn, InterviewProposeIn, InterviewRespondIn, InterviewUpdate
from ..security import get_current_user, require_applicant, require_recruiter

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

_COLS = """i.interview_id, i.application_id, i.scheduled_on, i.mode,
           i.interviewer, i.status, i.message, i.feedback, i.result,
           c.candidate_id, j.job_id,
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
    status: str = Query(default=None, pattern=r"^(proposed|scheduled|declined|cancelled|completed)$"),
    user: dict = Depends(require_recruiter),
):
    params: list = [user["user_id"]]
    extra = ""
    if application_id is not None:
        extra += " AND a.application_id = %s"
        params.append(application_id)
    if status is not None:
        extra += " AND i.status = %s"
        params.append(status)
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


def _applicant_application(application_id: int, user_id: int) -> dict:
    app = db.fetch_one(
        """SELECT a.application_id, a.status FROM applications a
           JOIN candidates c ON c.candidate_id = a.candidate_id
           WHERE a.application_id = %s AND c.user_id = %s""",
        (application_id, user_id),
    )
    if app is None:
        raise HTTPException(
            status_code=404, detail="Application not found or not yours"
        )
    return app


@router.post("/propose", status_code=status.HTTP_201_CREATED)
def propose_interview(data: InterviewProposeIn, user: dict = Depends(require_applicant)):
    """Applicant proposes a slot for an approved ('interview'-stage) application.

    The proposal waits as status='proposed' until the recruiter accepts
    (→ 'scheduled') or declines (→ 'declined') it.
    """
    app = _applicant_application(data.application_id, user["user_id"])
    if app["status"] != "interview":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You can only propose a slot once your application is approved for interview",
        )
    existing = db.fetch_one(
        """SELECT interview_id FROM interviews
           WHERE application_id = %s AND status IN ('proposed', 'scheduled')""",
        (data.application_id,),
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="There is already a pending or scheduled interview for this application",
        )
    row = db.execute_returning(
        """INSERT INTO interviews (application_id, scheduled_on, mode, message, status)
           VALUES (%s, %s, %s, %s, 'proposed')
           RETURNING interview_id""",
        (data.application_id, data.scheduled_on, data.mode, data.message),
    )
    return {"interview_id": row["interview_id"], "status": "proposed"}


@router.patch("/{interview_id}/respond")
def respond_to_proposal(
    interview_id: int, data: InterviewRespondIn, user: dict = Depends(require_recruiter)
):
    """Recruiter accepts (→ scheduled) or declines a proposed slot."""
    row = db.fetch_one(
        """SELECT i.interview_id, i.status, a.application_id FROM interviews i
           JOIN applications a ON a.application_id = i.application_id
           JOIN jobs j ON j.job_id = a.job_id
           WHERE i.interview_id = %s AND j.recruiter_id = %s""",
        (interview_id, user["user_id"]),
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    if row["status"] != "proposed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only proposed slots can be accepted or declined",
        )
    new_status = "scheduled" if data.action == "accept" else "declined"
    db.execute(
        "UPDATE interviews SET status = %s WHERE interview_id = %s",
        (new_status, interview_id),
    )
    return {"ok": True, "status": new_status}
