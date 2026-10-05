"""Unit tests for the AI engine — no database needed.

Run:  pytest tests/test_ai.py -v
"""
from app.ai.matcher import score_candidate
from app.ai.parser import clean_text, extract_text
from app.ai.skills import (
    extract_experience_years,
    extract_qualification,
    extract_skills,
)

RESUME = """
AARAV MEHTA — Backend Developer
3 years building REST APIs with Python and Django.
PostgreSQL schema design and Docker deployments.
B.Tech Computer Science, 2021.
"""


def test_extract_skills_finds_known_skills():
    skills = extract_skills(RESUME)
    for expected in ["python", "django", "postgresql", "rest", "docker"]:
        assert expected in skills, f"missing {expected}"


def test_extract_skills_no_false_positives():
    # "java" must not match inside "javascript"
    skills = extract_skills("5 years of JavaScript and React development.")
    assert "javascript" in skills
    assert "react" in skills
    assert "java" not in skills


def test_extract_experience_years():
    assert extract_experience_years(RESUME) == 3.0
    assert extract_experience_years("2.5+ years of SQL analytics") == 2.5
    assert extract_experience_years("no experience mentioned") == 0.0


def test_extract_qualification():
    q = extract_qualification(RESUME)
    assert "b.tech" in q


def test_matcher_perfect_candidate_scores_high():
    candidate = {
        "skills": "python, django, postgresql, rest, docker",
        "experience_years": 3.0,
        "qualification": "B.Tech Computer Science",
    }
    job = {
        "required_skills": "python, django, postgresql, rest",
        "min_experience_years": 2.0,
        "qualification": "B.Tech Computer Science",
    }
    r = score_candidate(candidate, job)
    assert r["score"] == 100.0
    assert r["matched_skills"] == ["django", "postgresql", "python", "rest"]
    assert r["missing_skills"] == []


def test_matcher_weak_candidate_scores_low():
    candidate = {
        "skills": "javascript, react, css",
        "experience_years": 1.0,
        "qualification": "B.Sc Computer Science",
    }
    job = {
        "required_skills": "python, django, postgresql, rest",
        "min_experience_years": 2.0,
        "qualification": "B.Tech Computer Science",
    }
    r = score_candidate(candidate, job)
    assert r["score"] < 40.0
    assert set(r["missing_skills"]) == {"python", "django", "postgresql", "rest"}


def test_matcher_is_deterministic():
    candidate = {"skills": "python, sql", "experience_years": 2.0,
                 "qualification": "M.Sc Data Science"}
    job = {"required_skills": "python, sql, pandas",
           "min_experience_years": 2.0, "qualification": "M.Sc Data Science"}
    assert score_candidate(candidate, job) == score_candidate(candidate, job)


def test_parser_rejects_garbage():
    try:
        extract_text(b"short", "resume.pdf")
    except ValueError:
        return
    raise AssertionError("expected ValueError for unreadable resume")


def test_parser_rejects_bad_extension():
    try:
        extract_text(b"x" * 100, "resume.exe")
    except ValueError:
        return
    raise AssertionError("expected ValueError for unsupported format")


def test_clean_text():
    assert clean_text("a   b\n\n\nc") == "a b\nc"
