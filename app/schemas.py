"""Pydantic request/response schemas shared by all routers."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: str = Field(pattern=r"^(applicant|recruiter)$")


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class JobIn(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    company: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = None
    required_skills: str = Field(min_length=2)  # comma-separated
    qualification: Optional[str] = None
    min_experience_years: float = Field(default=0, ge=0)
    location: Optional[str] = None
    employment_type: str = "Full-time"
    salary_range: Optional[str] = Field(default=None, max_length=60)
    openings: int = Field(default=1, ge=1)
    is_active: bool = True


class ProfileIn(BaseModel):
    phone: Optional[str] = Field(default=None, max_length=30)
    location: Optional[str] = Field(default=None, max_length=120)
    skills: Optional[str] = None  # comma-separated
    experience_years: Optional[float] = Field(default=None, ge=0)
    qualification: Optional[str] = Field(default=None, max_length=200)


class ApplyIn(BaseModel):
    job_id: int


class StatusIn(BaseModel):
    status: str = Field(
        pattern=r"^(applied|screening|interview|offer|rejected|hired)$"
    )


class InterviewIn(BaseModel):
    application_id: int
    scheduled_on: datetime
    mode: str = Field(pattern=r"^(online|in-person|phone)$")
    interviewer: Optional[str] = Field(default=None, max_length=120)


class InterviewUpdate(BaseModel):
    feedback: Optional[str] = None
    result: Optional[str] = Field(default=None, pattern=r"^(pending|selected|rejected)$")
    scheduled_on: Optional[datetime] = None


class InterviewProposeIn(BaseModel):
    """Applicant-proposed slot — waits for recruiter accept/decline."""

    application_id: int
    scheduled_on: datetime
    mode: str = Field(pattern=r"^(online|in-person|phone)$")
    message: Optional[str] = Field(default=None, max_length=500)


class InterviewRespondIn(BaseModel):
    action: str = Field(pattern=r"^(accept|decline)$")
