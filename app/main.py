"""SmartRecruit — FastAPI application entrypoint.

Run:
    uvicorn app.main:app --reload            (from the project root)

Then open http://127.0.0.1:8000 in a browser.
API docs: http://127.0.0.1:8000/docs
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import db
from .routers import (
    admin,
    applicants,
    applications,
    auth,
    interviews,
    jobs,
    reports,
    screening,
)

app = FastAPI(
    title="SmartRecruit API",
    description="AI-Integrated Online Recruitment Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth.router,
    jobs.router,
    applicants.router,
    applications.router,
    interviews.router,
    screening.router,
    reports.router,
    admin.router,
):
    app.include_router(router)


@app.get("/api/health")
def health():
    db.fetch_one("SELECT 1")
    return {"status": "ok", "database": "connected"}


# ---------------------------------------------------------------------
# Frontend (single-page app in ./frontend: index.html + styles.css + app.js)
# Hash routing means the browser only ever requests / and the assets;
# the mount below serves them, and API routes registered above win.
# ---------------------------------------------------------------------
_FRONTEND = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")

if os.path.isdir(_FRONTEND):

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(os.path.join(_FRONTEND, "index.html"))

    app.mount("/", StaticFiles(directory=_FRONTEND, html=True), name="frontend")


@app.on_event("shutdown")
def _shutdown():
    db.close_pool()
