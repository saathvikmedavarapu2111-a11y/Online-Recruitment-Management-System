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
-- Jobs (posted by Meera Nair)
-- ---------------------------------------------------------------------
INSERT INTO jobs (recruiter_id, title, description, required_skills,
                  qualification, min_experience_years, location, employment_type)
SELECT u.user_id, v.title, v.description, v.required_skills, v.qualification,
       v.min_experience_years, v.location, v.employment_type
FROM users u
CROSS JOIN (VALUES
  ('Backend Developer',
   'Build and maintain REST APIs for our fintech platform.',
   'python, django, postgresql, rest',
   'B.Tech Computer Science', 2.0, 'Bengaluru', 'Full-time'),
  ('Frontend Developer',
   'Build responsive customer-facing interfaces.',
   'javascript, react, css',
   'B.Sc Computer Science', 1.0, 'Chennai', 'Full-time'),
  ('Data Analyst',
   'SQL analytics and reporting for product teams.',
   'python, sql, pandas',
   'M.Sc Data Science', 2.0, 'Pune', 'Full-time')
) AS v(title, description, required_skills, qualification,
       min_experience_years, location, employment_type)
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
