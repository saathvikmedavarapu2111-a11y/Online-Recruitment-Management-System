"""Candidate–job match scoring.

Deterministic, explainable formula (no black box):

    score = 100 * (0.65 * skill_score
                 + 0.20 * experience_score
                 + 0.15 * education_score)

- skill_score      = matched required skills / total required skills
- experience_score = min(candidate_years / required_years, 1.0)
                     (1.0 when the job lists no requirement)
- education_score  = 1.0 if a degree keyword overlaps the job's
                     requirement, 0.6 if the candidate holds some degree,
                     0.0 otherwise (1.0 when the job lists nothing)

`score_candidate` returns the score plus the matched / missing skill
lists so the recruiter can see *why* a candidate ranked where they did.
"""
from .skills import DEGREE_KEYWORDS, split_skills

W_SKILL, W_EXP, W_EDU = 0.65, 0.20, 0.15


def _education_score(candidate_qual: str | None, job_qual: str | None) -> float:
    cand = (candidate_qual or "").lower()
    job = (job_qual or "").lower()
    if not job.strip():
        return 1.0
    cand_degrees = {d for d in DEGREE_KEYWORDS if d in cand}
    job_degrees = {d for d in DEGREE_KEYWORDS if d in job}
    if cand_degrees & job_degrees:
        return 1.0
    if cand_degrees:
        return 0.6
    return 0.0


def score_candidate(candidate: dict, job: dict) -> dict:
    cand_skills = set(split_skills(candidate.get("skills")))
    req_skills = set(split_skills(job.get("required_skills")))

    matched = sorted(cand_skills & req_skills)
    missing = sorted(req_skills - cand_skills)
    skill_score = (len(matched) / len(req_skills)) if req_skills else 1.0

    req_exp = float(job.get("min_experience_years") or 0)
    cand_exp = float(candidate.get("experience_years") or 0)
    exp_score = min(cand_exp / req_exp, 1.0) if req_exp > 0 else 1.0

    edu_score = _education_score(candidate.get("qualification"), job.get("qualification"))

    score = round(100 * (W_SKILL * skill_score + W_EXP * exp_score + W_EDU * edu_score), 2)
    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "breakdown": {
            "skill_score": round(skill_score, 3),
            "experience_score": round(exp_score, 3),
            "education_score": round(edu_score, 3),
        },
    }
