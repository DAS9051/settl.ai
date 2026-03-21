from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Business schemas
# ---------------------------------------------------------------------------

class BusinessCreate(BaseModel):
    name: str
    contact_email: str


class BusinessOut(BaseModel):
    id: uuid.UUID
    clerk_user_id: str
    name: str
    contact_email: str
    verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Job schemas
# ---------------------------------------------------------------------------

class JobCreate(BaseModel):
    title: str
    description: str
    location: str
    salary_range: Optional[str] = None
    skills_required: List[str] = Field(default_factory=list)


class JobOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    title: str
    description: str
    location: str
    salary_range: Optional[str]
    skills_required: List[str]
    verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class JobListOut(BaseModel):
    jobs: List[JobOut]
    total: int


# ---------------------------------------------------------------------------
# Profile schemas
# ---------------------------------------------------------------------------

class EducationEntry(BaseModel):
    school: str
    degree: str
    year: Optional[str] = None


class ExperienceEntry(BaseModel):
    company: str
    role: str
    years: Optional[str] = None
    description: Optional[str] = None


class ProfileCreate(BaseModel):
    skills: List[str] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    target_roles: List[str] = Field(default_factory=list)


class ProfileOut(BaseModel):
    id: uuid.UUID
    clerk_user_id: str
    skills: List[str]
    education: List[Dict[str, Any]]
    certifications: List[str]
    experience: List[Dict[str, Any]]
    target_roles: List[str]
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# AI Counselor schemas
# ---------------------------------------------------------------------------

class CounselRequest(BaseModel):
    clerk_user_id: str
    extra_context: Optional[str] = None


class CounselResponse(BaseModel):
    roadmap: List[str]
    current_matches: List[JobOut]
    board_recommendations: List[str]


# ---------------------------------------------------------------------------
# Skills gap schemas
# ---------------------------------------------------------------------------

class SkillsGapResponse(BaseModel):
    missing_skills: List[str]
    matching_skills: List[str]
    gap_analysis: str  # 2-3 sentence summary
    recommendations: List[str]  # concrete steps to close the gap


# ---------------------------------------------------------------------------
# Salary insight schemas
# ---------------------------------------------------------------------------

class SalaryInsightRequest(BaseModel):
    role: str
    location: str
    skills: List[str] = Field(default_factory=list)


class SalaryInsightResponse(BaseModel):
    role: str
    location: str
    estimated_min: int  # USD annual
    estimated_max: int
    median: int
    notes: str  # 1-2 sentence context


# ---------------------------------------------------------------------------
# Resume schemas
# ---------------------------------------------------------------------------

class ResumeImportRequest(BaseModel):
    resume_text: str


# ---------------------------------------------------------------------------
# Cover letter schemas
# ---------------------------------------------------------------------------

class CoverLetterRequest(BaseModel):
    job_id: str


class CoverLetterResponse(BaseModel):
    cover_letter: str
