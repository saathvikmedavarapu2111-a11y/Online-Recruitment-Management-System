# SmartRecruit — AI-Integrated Online Recruitment Management System

A complete, working recruitment platform: role-based portals for applicants,
recruiters and admins, a PostgreSQL backend with a normalized schema, and an
AI engine that parses resumes and ranks candidates with an explainable match
score.

Built for the PBL **Review-4: Results & Analysis** milestone.

---

## 1. Features

| Module | What it does |
|---|---|
| **Applicant portal** | Register/login, browse & search jobs, apply in one click, track live application status, upload resume (PDF/DOCX/TXT) with automatic skill extraction, view scheduled interviews |
| **Recruiter portal** | Post/edit/delete jobs, review applications per job, **run AI screening** → ranked shortlist with match scores, update application status, schedule interviews, record feedback & results, dashboard with funnel analytics |
| **Admin console** | System-wide counts, users by role, applications by status, user management |
| **AI engine** | Resume text extraction → skill/qualification/experience extraction → similarity-based match scoring (deterministic, explainable formula) |
| **Database** | Normalized PostgreSQL schema (users, candidates, jobs, applications, interviews, match_scores), PK/FK integrity, full-text GIN indexes for fast search |

## 2. Tech stack

- **Backend:** Python + FastAPI (REST API, auto docs at `/docs`)
- **Database:** PostgreSQL (raw, parameterized SQL via `psycopg` — no ORM, every query is visible in `app/routers/`)
- **Auth:** bcrypt password hashing + JWT bearer tokens, role-based access control
- **AI:** `pypdf` / `python-docx` for resume parsing, curated skill vocabulary + regex NLP, weighted match-score formula
- **Frontend:** vanilla HTML/CSS/JS (no build step), served by FastAPI

## 3. Project structure

```
smartrecruit/
├── schema.sql              # PostgreSQL DDL: tables, constraints, indexes
├── seed.sql                # demo users, jobs, applications, interviews
├── requirements.txt
├── .env.example            # copy to .env and fill in (never commit .env)
├── app/
│   ├── main.py             # FastAPI app, routers, static frontend
│   ├── config.py           # env-based settings
│   ├── db.py               # connection pool + query helpers
│   ├── security.py         # bcrypt, JWT, role guards
│   ├── schemas.py          # pydantic request models
│   ├── ai/
│   │   ├── parser.py       # PDF/DOCX/TXT resume text extraction
│   │   ├── skills.py       # skill vocabulary + feature extraction
│   │   └── matcher.py      # match-score formula
│   └── routers/            # auth, jobs, applicants, applications,
│                           # interviews, screening, reports, admin
├── frontend/               # index (login), applicant, recruiter, admin
└── tests/                  # pytest: AI unit tests + end-to-end API tests
```

## 4. Setup

### 4.1 PostgreSQL

```bash
# create the database and user (adjust names as you like)
sudo -u postgres psql -c "CREATE USER smartrecruit WITH PASSWORD 'smartrecruit';"
sudo -u postgres psql -c "CREATE DATABASE smartrecruit OWNER smartrecruit;"

# create tables + load demo data
psql "postgresql://smartrecruit:smartrecruit@localhost:5432/smartrecruit" -f schema.sql
psql "postgresql://smartrecruit:smartrecruit@localhost:5432/smartrecruit" -f seed.sql
```

### 4.2 Backend

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then edit DATABASE_URL / JWT_SECRET
uvicorn app.main:app --reload
```

Open **http://127.0.0.1:8000** — the login page. API docs at `/docs`.

### 4.3 Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartrecruit.app` | `admin123` |
| Recruiter | `meera.nair@smartrecruit.app` | `password123` |
| Recruiter | `arjun.menon@smartrecruit.app` | `password123` |
| Applicant | `aarav.mehta@example.com` | `password123` |
| Applicant | `sneha.rao@example.com` | `password123` |
| Applicant | `vikram.nair@example.com` | `password123` |
| Applicant | `divya.patel@example.com` | `password123` |

## 5. How the AI scoring works

`POST /api/screening/job/{id}/run` scores every applicant for a job:

```
score = 100 × (0.65 × skill_score + 0.20 × experience_score + 0.15 × education_score)
```

- **skill_score** = matched required skills ÷ total required skills
- **experience_score** = min(candidate_years ÷ required_years, 1.0)
- **education_score** = 1.0 on degree-keyword overlap, 0.6 for any degree, else 0

Results (score + matched/missing skills) are stored in `match_scores` and shown
as a ranked shortlist. **Scores are advisory — the recruiter makes the final
hiring decision.** The full derivation is in `app/ai/matcher.py`.

## 6. Key API endpoints

| Method & path | Role | Purpose |
|---|---|---|
| `POST /api/auth/register` | — | create applicant/recruiter account |
| `POST /api/auth/login` | — | get JWT token |
| `GET /api/jobs?search=&location=&skill=` | — | job search (full-text indexed) |
| `POST /api/jobs` | recruiter | post a job |
| `PUT /api/applicants/me` | applicant | update profile |
| `POST /api/applicants/me/resume` | applicant | upload + parse resume |
| `POST /api/applications` | applicant | apply to a job |
| `GET /api/applications/job/{id}` | recruiter | applications for a job |
| `PATCH /api/applications/{id}/status` | recruiter | move through pipeline |
| `POST /api/screening/job/{id}/run` | recruiter | AI score + rank applicants |
| `POST /api/interviews` | recruiter | schedule interview |
| `PATCH /api/interviews/{id}` | recruiter | feedback + result |
| `GET /api/reports/overview` | recruiter | funnel analytics |
| `GET /api/reports/admin/overview` | admin | system-wide stats |

## 7. Testing

```bash
# AI unit tests (no database needed)
pytest tests/test_ai.py -v

# End-to-end API tests (needs PostgreSQL; uses TEST_DATABASE_URL,
# creates + deletes its own rows, so point it at a scratch DB)
TEST_DATABASE_URL=postgresql://smartrecruit:smartrecruit@localhost:5432/smartrecruit_test \
  pytest tests/test_api.py -v
```

## 8. Notes for the team

- **Credentials never go in chat or git.** Database passwords and the
  `JWT_SECRET` live only in your local `.env` (see `.gitignore`).
- The demo data in `seed.sql` mirrors the Review-4 deck: Aarav/Sneha/Vikram
  as the ranked candidates for the Backend Developer job.
- Every number claimed in the deck's testing slides can be reproduced with
  the test suite above — run it before the review and note the real figures.
