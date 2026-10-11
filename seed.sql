-- =====================================================================
-- SmartRecruit — demo seed data
-- Run AFTER schema.sql:  psql $DATABASE_URL -f seed.sql
--
-- Demo logins (all passwords are 'password123', admin is 'admin123'):
--   admin@smartrecruit.app            (admin)
--   meera.nair@smartrecruit.app       (recruiter)
--   arjun.menon@smartrecruit.app      (recruiter)
--   aarav.mehta@example.com           (applicant)
--   sneha.rao@example.com             (applicant)
--   vikram.nair@example.com           (applicant)
--   divya.patel@example.com           (applicant)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role) VALUES
('Site Administrator', 'admin@smartrecruit.app',
 '$2b$12$r9F6UtfmKFrsJjvPy1zUlOC..7E.S2FSXJSp04oJfVj.Yf01ui.5G', 'admin'),
('Meera Nair', 'meera.nair@smartrecruit.app',
 '$2b$12$z5KYIL.jz1YPEcU8SmmHR.pKNprCKe9O31.HgveroG3M3SapF8tjC', 'recruiter'),
('Arjun Menon', 'arjun.menon@smartrecruit.app',
 '$2b$12$z5KYIL.jz1YPEcU8SmmHR.pKNprCKe9O31.HgveroG3M3SapF8tjC', 'recruiter'),
('Aarav Mehta', 'aarav.mehta@example.com',
 '$2b$12$z5KYIL.jz1YPEcU8SmmHR.pKNprCKe9O31.HgveroG3M3SapF8tjC', 'applicant'),
('Sneha Rao', 'sneha.rao@example.com',
 '$2b$12$z5KYIL.jz1YPEcU8SmmHR.pKNprCKe9O31.HgveroG3M3SapF8tjC', 'applicant'),
('Vikram Nair', 'vikram.nair@example.com',
 '$2b$12$z5KYIL.jz1YPEcU8SmmHR.pKNprCKe9O31.HgveroG3M3SapF8tjC', 'applicant'),
('Divya Patel', 'divya.patel@example.com',
 '$2b$12$z5KYIL.jz1YPEcU8SmmHR.pKNprCKe9O31.HgveroG3M3SapF8tjC', 'applicant')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------
-- Candidate profiles (+ parsed resume text, as the AI parser would store)
-- ---------------------------------------------------------------------
INSERT INTO candidates (user_id, phone, location, skills, experience_years,
                        qualification, resume_text, resume_filename)
SELECT u.user_id, v.phone, v.location, v.skills, v.experience_years,
       v.qualification, v.resume_text, v.resume_filename
FROM users u
JOIN (VALUES
  ('aarav.mehta@example.com', '+91 98200 11223', 'Bengaluru',
   'python, django, postgresql, rest, docker',
   3.0, 'B.Tech Computer Science',
   'AARAV MEHTA - Backend Developer. 3 years building REST APIs with Python and Django. '
   'Strong PostgreSQL schema design, query optimization and Docker-based deployments. '
   'Built an order-management service handling 10k requests/day. B.Tech Computer Science, 2021.',
   'aarav_mehta_resume.pdf'),
  ('sneha.rao@example.com', '+91 98200 44556', 'Hyderabad',
   'java, spring, postgresql, microservices',
   2.0, 'B.Tech Information Technology',
   'SNEHA RAO - Java Backend Developer. 2 years with Java and Spring Boot microservices. '
   'Worked with PostgreSQL and Redis caching. B.Tech Information Technology, 2022.',
   'sneha_rao_resume.pdf'),
  ('vikram.nair@example.com', '+91 98200 77889', 'Chennai',
   'javascript, react, node.js, css',
   1.5, 'B.Sc Computer Science',
   'VIKRAM NAIR - Frontend Developer. 1.5 years building responsive interfaces with '
   'JavaScript and React. Familiar with Node.js backends and CSS frameworks. '
   'B.Sc Computer Science, 2023.',
   'vikram_nair_resume.pdf'),
  ('divya.patel@example.com', '+91 98200 99001', 'Pune',
   'python, pandas, sql, machine learning',
   2.5, 'M.Sc Data Science',
   'DIVYA PATEL - Data Analyst. 2.5 years of SQL analytics and Python (pandas) reporting. '
   'Built churn-prediction prototypes with machine learning. M.Sc Data Science, 2022.',
   'divya_patel_resume.pdf')
) AS v(email, phone, location, skills, experience_years, qualification,
       resume_text, resume_filename)
  ON v.email = u.email
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Jobs (posted by Meera Nair) — mirrors the product's eight enriched roles
-- ---------------------------------------------------------------------
INSERT INTO jobs (recruiter_id, title, company, description, required_skills,
                  qualification, min_experience_years, location, employment_type,
                  salary_range, openings)
SELECT u.user_id, v.title, v.company, v.description, v.required_skills, v.qualification,
       v.min_experience_years, v.location, v.employment_type, v.salary_range, v.openings
FROM users u
CROSS JOIN (VALUES
  ('Backend Developer', 'FinEdge Technologies',
   'Build and maintain REST APIs for our fintech platform. FinEdge is a growing fintech startup processing over 2M transactions a day. You will join a 12-person engineering team owning services end to end.',
   'python, django, postgresql, rest',
   'B.Tech Computer Science', 2.0, 'Bengaluru', 'Full-time', '₹12–18 LPA', 3),
  ('Frontend Developer', 'BrightKart Retail',
   'Build responsive customer-facing interfaces. BrightKart serves 5M shoppers a month. Our storefront team cares deeply about performance and polish.',
   'javascript, react, css',
   'B.Sc Computer Science', 1.0, 'Chennai', 'Full-time', '₹8–12 LPA', 2),
  ('Data Analyst', 'HealthLoop Analytics',
   'SQL analytics and reporting for product teams. HealthLoop turns hospital operations data into decisions. Small data team, large ownership.',
   'python, sql, pandas',
   'M.Sc Data Science', 2.0, 'Pune', 'Full-time', '₹10–14 LPA', 2),
  ('DevOps Engineer', 'FinEdge Technologies',
   'Own CI/CD pipelines and cloud infrastructure on AWS. FinEdge runs entirely on AWS. You will keep 40+ services deploying safely, several times a day.',
   'docker, kubernetes, aws',
   'B.Tech Computer Science', 3.0, 'Bengaluru', 'Full-time', '₹14–20 LPA', 1),
  ('ML Engineer', 'VisionCraft AI',
   'Build and ship machine-learning models to production. VisionCraft builds vision models for retail. Research-friendly team with a strong MLOps culture.',
   'python, machine learning, tensorflow',
   'M.Tech Artificial Intelligence', 2.0, 'Bengaluru', 'Full-time', '₹16–24 LPA', 2),
  ('UI/UX Designer', 'BrightKart Retail',
   'Design intuitive product experiences from research to prototype. BrightKart''s design team of six owns the end-to-end shopper journey across web and mobile.',
   'figma, prototyping, user research',
   'B.Des', 2.0, 'Remote', 'Full-time', '₹9–13 LPA', 1),
  ('QA Engineer', 'FinEdge Technologies',
   'Automate testing and guard release quality. Quality is a first-class function at FinEdge — QA engineers pair directly with developers.',
   'selenium, python, testing',
   'B.Sc Computer Science', 1.5, 'Hyderabad', 'Full-time', '₹7–10 LPA', 2),
  ('Product Manager', 'VisionCraft AI',
   'Own the roadmap for our hiring platform. VisionCraft is launching an AI hiring product. You will own discovery, roadmap and launch.',
   'roadmap, agile, analytics',
   'MBA', 3.0, 'Bengaluru', 'Full-time', '₹18–26 LPA', 1)
) AS v(title, company, description, required_skills, qualification,
       min_experience_years, location, employment_type, salary_range, openings)
WHERE u.email = 'meera.nair@smartrecruit.app'
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- Applications: everyone applies to the Backend Developer job (job 1),
-- plus a couple of targeted applications.
-- ---------------------------------------------------------------------
INSERT INTO applications (candidate_id, job_id, status)
SELECT c.candidate_id, j.job_id,
       CASE u.email
         WHEN 'aarav.mehta@example.com' THEN 'interview'
         WHEN 'sneha.rao@example.com'   THEN 'screening'
         ELSE 'applied'
       END
FROM users u
JOIN candidates c ON c.user_id = u.user_id
CROSS JOIN (SELECT job_id FROM jobs WHERE title = 'Backend Developer' LIMIT 1) j
WHERE u.role = 'applicant'
ON CONFLICT (candidate_id, job_id) DO NOTHING;

INSERT INTO applications (candidate_id, job_id, status)
SELECT c.candidate_id, j.job_id, 'applied'
FROM users u
JOIN candidates c ON c.user_id = u.user_id
CROSS JOIN (SELECT job_id FROM jobs WHERE title = 'Frontend Developer' LIMIT 1) j
WHERE u.email = 'vikram.nair@example.com'
ON CONFLICT (candidate_id, job_id) DO NOTHING;

INSERT INTO applications (candidate_id, job_id, status)
SELECT c.candidate_id, j.job_id, 'applied'
FROM users u
JOIN candidates c ON c.user_id = u.user_id
CROSS JOIN (SELECT job_id FROM jobs WHERE title = 'Data Analyst' LIMIT 1) j
WHERE u.email = 'divya.patel@example.com'
ON CONFLICT (candidate_id, job_id) DO NOTHING;

-- ---------------------------------------------------------------------
-- One interview scheduled for Aarav (Backend Developer application)
-- ---------------------------------------------------------------------
INSERT INTO interviews (application_id, scheduled_on, mode, interviewer, feedback, result)
SELECT a.application_id, NOW() + INTERVAL '2 days', 'online', 'Meera Nair',
       'Strong API design answers; system-design round pending.', 'pending'
FROM applications a
JOIN candidates c ON c.candidate_id = a.candidate_id
JOIN users u ON u.user_id = c.user_id
JOIN jobs j ON j.job_id = a.job_id
WHERE u.email = 'aarav.mehta@example.com' AND j.title = 'Backend Developer'
ON CONFLICT DO NOTHING;
