"""Candidate (applicant) profiles: view/update + resume upload.

Resume upload is where the AI pipeline starts: the file is parsed to
text, skills / experience / qualification are extracted, and the
candidate profile is updated from the findings.
"""
import os

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from .. import db
from ..ai.parser import extract_text
from ..ai.skills import (
    extract_experience_years,
    extract_qualification,
    extract_skills,
)
from ..config import settings
from ..schemas import ProfileIn
from ..security import get_current_user, require_applicant, require_recruiter

router = APIRouter(prefix="/api/applicants", tags=["applicants"])

_PROFILE_COLS = """c.candidate_id, c.user_id, c.phone, c.location, c.skills,
                   c.experience_years, c.qualification, c.resume_text, c.resume_filename,
                   c.updated_at"""


def _own_profile(user_id: int) -> dict:
    profile = db.fetch_one(
        f"SELECT {_PROFILE_COLS} FROM candidates c WHERE c.user_id = %s", (user_id,)
    )
    if profile is None:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return profile


@router.get("/me")
def my_profile(user: dict = Depends(require_applicant)):
    return _own_profile(user["user_id"])


@router.put("/me")
def update_profile(data: ProfileIn, user: dict = Depends(require_applicant)):
    profile = _own_profile(user["user_id"])
    db.execute(
        """UPDATE candidates
           SET phone = COALESCE(%s, phone),
               location = COALESCE(%s, location),
               skills = COALESCE(%s, skills),
               experience_years = COALESCE(%s, experience_years),
               qualification = COALESCE(%s, qualification),
               updated_at = NOW()
           WHERE candidate_id = %s""",
        (
            data.phone, data.location,
            data.skills.strip().lower() if data.skills else None,
            data.experience_years, data.qualification,
            profile["candidate_id"],
        ),
    )
    return {"ok": True}


@router.post("/me/resume")
async def upload_resume(
    file: UploadFile = File(...), user: dict = Depends(require_applicant)
):
    profile = _own_profile(user["user_id"])
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must be under 5 MB",
        )
    try:
        text = extract_text(data, file.filename or "resume.txt")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Keep a copy on disk for audit; the parsed text lives in the DB.
    os.makedirs(settings.upload_dir, exist_ok=True)
    safe_name = f"candidate_{profile['candidate_id']}_{os.path.basename(file.filename or 'resume.txt')}"
    with open(os.path.join(settings.upload_dir, safe_name), "wb") as f:
        f.write(data)

    # AI feature extraction -> merge into the profile.
    found_skills = extract_skills(text)
    found_exp = extract_experience_years(text)
    found_qual = extract_qualification(text)
    existing = {s.strip().lower() for s in (profile["skills"] or "").split(",") if s.strip()}
    merged = sorted(existing | set(found_skills))

    db.execute(
        """UPDATE candidates
           SET resume_text = %s, resume_filename = %s,
               skills = %s,
               experience_years = GREATEST(experience_years, %s),
               qualification = CASE WHEN qualification IS NULL OR qualification = ''
                                    THEN %s ELSE qualification END,
               updated_at = NOW()
           WHERE candidate_id = %s""",
        (
            text, file.filename, ", ".join(merged) or None,
            found_exp, found_qual or None, profile["candidate_id"],
        ),
    )
    return {
        "ok": True,
        "extracted_skills": found_skills,
        "extracted_experience_years": found_exp,
        "extracted_qualification": found_qual,
        "text_chars": len(text),
    }


@router.get("")
def search_candidates(
    search: str = Query(default=""),
    skill: str = Query(default=""),
    user: dict = Depends(require_recruiter),
):
    """Recruiter candidate search (name / skill full-text)."""
    clauses, params = [], []
    if search.strip():
        clauses.append(
            "(to_tsvector('english', u.name) @@ plainto_tsquery('english', %s) "
            "OR to_tsvector('english', COALESCE(c.skills,'')) "
            "@@ plainto_tsquery('english', %s))"
        )
        params += [search, search]
    if skill.strip():
        clauses.append(
            "to_tsvector('english', COALESCE(c.skills,'')) "
            "@@ plainto_tsquery('english', %s)"
        )
        params.append(skill)
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    return db.fetch_all(
        f"""SELECT {_PROFILE_COLS}, u.name, u.email
            FROM candidates c JOIN users u ON u.user_id = c.user_id
            {where}
            ORDER BY c.updated_at DESC LIMIT 200""",
        params,
    )
