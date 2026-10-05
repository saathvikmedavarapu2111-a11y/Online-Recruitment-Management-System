"""Feature extraction from resume text.

- `extract_skills`: finds known skills via a curated vocabulary
  (canonical name -> list of aliases), matched case-insensitively on
  word boundaries so "java" doesn't match "javascript".
- `extract_experience_years`: pulls the largest "<n> years" mention.
- `extract_qualification`: pulls degree keywords (b.tech, m.sc, ...).
"""
import re

# Canonical skill -> aliases that should count as the same skill.
SKILL_ALIASES: dict[str, list[str]] = {
    # languages
    "python": ["python", "python3"],
    "java": ["java"],
    "javascript": ["javascript", "js"],
    "typescript": ["typescript", "ts"],
    "c": ["c language"],
    "c++": ["c++", "cpp"],
    "c#": ["c#", "csharp"],
    "go": ["golang", "go language"],
    "rust": ["rust"],
    "php": ["php"],
    "ruby": ["ruby"],
    "kotlin": ["kotlin"],
    "swift": ["swift"],
    # web
    "react": ["react", "react.js", "reactjs"],
    "angular": ["angular"],
    "vue": ["vue", "vue.js"],
    "node.js": ["node.js", "nodejs", "node"],
    "django": ["django"],
    "flask": ["flask"],
    "spring": ["spring", "spring boot"],
    "express": ["express", "express.js"],
    "html": ["html"],
    "css": ["css"],
    "graphql": ["graphql"],
    "rest": ["rest", "rest api", "restful"],
    "microservices": ["microservices"],
    # data
    "sql": ["sql"],
    "postgresql": ["postgresql", "postgres"],
    "mysql": ["mysql"],
    "mongodb": ["mongodb", "mongo"],
    "redis": ["redis"],
    "pandas": ["pandas"],
    "numpy": ["numpy"],
    "machine learning": ["machine learning", "ml"],
    "deep learning": ["deep learning"],
    "tensorflow": ["tensorflow"],
    "pytorch": ["pytorch"],
    "data analysis": ["data analysis", "data analytics"],
    "excel": ["excel", "ms excel"],
    "tableau": ["tableau"],
    "power bi": ["power bi", "powerbi"],
    # devops / cloud
    "docker": ["docker"],
    "kubernetes": ["kubernetes", "k8s"],
    "git": ["git"],
    "jenkins": ["jenkins"],
    "aws": ["aws", "amazon web services"],
    "azure": ["azure"],
    "gcp": ["gcp", "google cloud"],
    "linux": ["linux"],
    # practices
    "agile": ["agile", "scrum"],
    "testing": ["testing", "unit testing"],
    "selenium": ["selenium"],
    "figma": ["figma"],
}

DEGREE_KEYWORDS = [
    "phd", "m.tech", "b.tech", "m.sc", "b.sc", "mba", "bca", "mca",
    "bachelor", "master",
]


def _compile_patterns() -> dict[str, re.Pattern]:
    patterns = {}
    for canonical, aliases in SKILL_ALIASES.items():
        # longest alias first so "spring boot" wins over "spring"
        ordered = sorted(aliases, key=len, reverse=True)
        body = "|".join(re.escape(a) for a in ordered)
        patterns[canonical] = re.compile(rf"(?<![\w+#])(?:{body})(?![\w+#])",
                                         re.IGNORECASE)
    return patterns


_PATTERNS = _compile_patterns()


def extract_skills(text: str) -> list[str]:
    """Return the sorted list of canonical skills found in the text."""
    found = [skill for skill, rx in _PATTERNS.items() if rx.search(text)]
    return sorted(found)


def extract_experience_years(text: str) -> float:
    """Largest '<number> years' mention, e.g. '3 years', '2.5+ years'."""
    matches = re.findall(
        r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)", text, re.IGNORECASE
    )
    nums = [float(m) for m in matches]
    return max(nums) if nums else 0.0


def extract_qualification(text: str) -> str:
    """Join the degree keywords found, e.g. 'b.tech, m.tech'."""
    low = text.lower()
    found = [d for d in DEGREE_KEYWORDS if d in low]
    return ", ".join(found)


def split_skills(csv: str | None) -> list[str]:
    """Turn a comma-separated skill column into a clean list."""
    if not csv:
        return []
    return [s.strip().lower() for s in csv.split(",") if s.strip()]
