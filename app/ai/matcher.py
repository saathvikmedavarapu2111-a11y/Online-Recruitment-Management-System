"""Candidate–job match scoring.

Deterministic, explainable formula (no black box):

    score = 100 * (0.65 * skill_score
                 + 0.20 * experience_score
                 + 0.15 * education_score)

Strict, resume-aware skill evidence (matches the product UI):

- a required skill counts 1.0 if *evidenced* in the candidate's resume text
- 0.6 if only *claimed* on the profile (in `skills`, not in the resume)
- 0.0 if absent from both

- skill_score      = sum of per-skill evidence weights / total required skills
- experience_score = min(candidate_years / required_years, 1.0)
                     (1.0 when the job lists no requirement)
- education_score  = 1.0 if a degree keyword overlaps the job's
                     requirement, 0.6 if the candidate holds some degree,
                     0.0 otherwise (1.0 when the job lists nothing)

`score_candidate` returns the score plus the per-skill evidence breakdown
so the recruiter can see *why* a candidate ranked where they did.
"""
from .skills import DEGREE_KEYWORDS, extract_skills, split_skills

W_SKILL, W_EXP, W_EDU = 0.65, 0.20, 0.15

# Profile-only skill claims are discounted: an unverified claim is worth
# less than resume evidence, but more than nothing.
W_EVIDENCED, W_CLAIMED, W_MISSING = 1.0, 0.6, 0.0


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


def _fuzzy_in(needle: str, haystack: set[str]) -> bool:
    """Same fuzzy rule as the product UI: exact or substring either way."""
    return any(h == needle or needle in h or h in needle for h in haystack)


def skill_evidence(
    candidate: dict, required_skills: list[str]
) -> list[dict]:
    """Per-skill evidence: 'evidenced' | 'claimed' | 'missing'.

    `candidate` may carry `resume_text`; skills extracted from it count as
    evidence. Profile `skills` alone count as (discounted) claims.
    """
    resume_skills = set(extract_skills(candidate.get("resume_text") or ""))
    profile_skills = set(split_skills(candidate.get("skills")))
    out = []
    for skill in required_skills:
        if _fuzzy_in(skill, resume_skills):
            status = "evidenced"
        elif _fuzzy_in(skill, profile_skills):
            status = "claimed"
        else:
            status = "missing"
        out.append({"skill": skill, "status": status})
    return out


def score_candidate(candidate: dict, job: dict) -> dict:
    req_skills = split_skills(job.get("required_skills"))

    evidence = skill_evidence(candidate, req_skills)
    weight = {"evidenced": W_EVIDENCED, "claimed": W_CLAIMED, "missing": W_MISSING}
    credit = sum(weight[e["status"]] for e in evidence)
    skill_score = (credit / len(req_skills)) if req_skills else 1.0

    matched = sorted(e["skill"] for e in evidence if e["status"] != "missing")
    missing = sorted(e["skill"] for e in evidence if e["status"] == "missing")
    verified = sorted(e["skill"] for e in evidence if e["status"] == "evidenced")
    claimed = sorted(e["skill"] for e in evidence if e["status"] == "claimed")

    req_exp = float(job.get("min_experience_years") or 0)
    cand_exp = float(candidate.get("experience_years") or 0)
    exp_score = min(cand_exp / req_exp, 1.0) if req_exp > 0 else 1.0

    edu_score = _education_score(candidate.get("qualification"), job.get("qualification"))

    score = round(100 * (W_SKILL * skill_score + W_EXP * exp_score + W_EDU * edu_score), 2)
    return {
        "score": score,
        "matched_skills": matched,
        "missing_skills": missing,
        "verified_skills": verified,
        "claimed_skills": claimed,
        "skill_evidence": evidence,
        "breakdown": {
            "skill_score": round(skill_score, 3),
            "experience_score": round(exp_score, 3),
            "education_score": round(edu_score, 3),
        },
    }
