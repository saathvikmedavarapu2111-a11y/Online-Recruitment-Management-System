-- =====================================================================
-- SmartRecruit — PostgreSQL schema
-- AI-Integrated Online Recruitment Management System
-- Run:  psql $DATABASE_URL -f schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- Users: every login belongs to exactly one role.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id       SERIAL PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL
                  CHECK (role IN ('applicant', 'recruiter', 'admin')),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Candidates: applicant profile, one-to-one with an applicant user.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id     SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL UNIQUE
                     REFERENCES users (user_id) ON DELETE CASCADE,
    phone            VARCHAR(30),
    location         VARCHAR(120),
    skills           TEXT,                       -- comma-separated, normalized
    experience_years NUMERIC(4, 1) NOT NULL DEFAULT 0,
    qualification    VARCHAR(200),
    resume_text      TEXT,                       -- parsed resume content
    resume_filename  VARCHAR(255),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Jobs: postings created by recruiters.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
    job_id               SERIAL PRIMARY KEY,
    recruiter_id         INTEGER NOT NULL
                         REFERENCES users (user_id) ON DELETE CASCADE,
    title                VARCHAR(160) NOT NULL,
    description          TEXT,
    required_skills      TEXT NOT NULL,           -- comma-separated
    qualification        VARCHAR(200),
    min_experience_years NUMERIC(4, 1) NOT NULL DEFAULT 0,
    location             VARCHAR(120),
    employment_type      VARCHAR(40) NOT NULL DEFAULT 'Full-time',
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Applications: a candidate applying to a job, with a live status.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
    application_id SERIAL PRIMARY KEY,
    candidate_id   INTEGER NOT NULL
                   REFERENCES candidates (candidate_id) ON DELETE CASCADE,
    job_id         INTEGER NOT NULL
                   REFERENCES jobs (job_id) ON DELETE CASCADE,
    status         VARCHAR(30) NOT NULL DEFAULT 'applied'
                   CHECK (status IN ('applied', 'screening', 'interview',
                                     'offer', 'rejected', 'hired')),
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (candidate_id, job_id)                 -- can't apply twice
);

-- ---------------------------------------------------------------------
-- Interviews: scheduled rounds attached to an application.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS interviews (
    interview_id   SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL
                   REFERENCES applications (application_id) ON DELETE CASCADE,
    scheduled_on   TIMESTAMPTZ NOT NULL,
    mode           VARCHAR(30) NOT NULL DEFAULT 'online'
                   CHECK (mode IN ('online', 'in-person', 'phone')),
    interviewer    VARCHAR(120),
    feedback       TEXT,
    result         VARCHAR(30) NOT NULL DEFAULT 'pending'
                   CHECK (result IN ('pending', 'selected', 'rejected')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- Match scores: AI screening output, one per application.
-- Advisory only — the recruiter makes the final decision.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_scores (
    score_id       SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL UNIQUE
                   REFERENCES applications (application_id) ON DELETE CASCADE,
    score          NUMERIC(5, 2) NOT NULL
                   CHECK (score >= 0 AND score <= 100),
    matched_skills TEXT,                         -- comma-separated
    missing_skills TEXT,                         -- comma-separated
    ranked_on      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- Indexes: keep filtered searches and multi-table joins fast.
-- (This is what the Review-4 performance chart measures.)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_candidates_skills
    ON candidates USING gin (to_tsvector('english', COALESCE(skills, '')));
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills
    ON jobs USING gin (to_tsvector('english', COALESCE(required_skills, '')));
CREATE INDEX IF NOT EXISTS idx_jobs_title
    ON jobs USING gin (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_job     ON applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_cand    ON applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter       ON jobs (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_active          ON jobs (is_active);
CREATE INDEX IF NOT EXISTS idx_interviews_app       ON interviews (application_id);
