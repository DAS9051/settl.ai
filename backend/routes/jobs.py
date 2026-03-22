import os
import uuid
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.business import Business
from models.job import Job
from models.profile import Profile
from schemas import (
    FirstWeekPrepResponse,
    InterviewPrepResponse,
    JargonTranslateRequest,
    JargonTranslationResponse,
    JobCreate,
    JobListOut,
    JobOut,
    ProfileOut,
    SkillsGapResponse,
)
from services.auth import get_current_user_dep
from services.claude_service import (
    analyze_skills_gap,
    generate_interview_prep,
    get_first_week_prep,
    translate_jargon,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])

ADMIN_KEY = os.environ.get("ADMIN_KEY", "hackathon-admin-secret")


def _job_to_out(job: Job, db: Session) -> JobOut:
    """Convert a Job ORM object to JobOut, populating business_name."""
    out = JobOut.model_validate(job)
    if job.business_id is not None:
        business = db.query(Business).filter(Business.id == job.business_id).first()
        if business:
            out.business_name = business.name
    return out


@router.get("/personal", response_model=JobListOut)
def list_personal_jobs(
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """List all personal tracked jobs for the authenticated user."""
    clerk_user_id: str = current_user.get("sub") or ""
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing sub claim.")
    jobs = db.query(Job).filter(
        Job.is_personal == True,
        Job.clerk_user_id == clerk_user_id,
    ).order_by(Job.created_at.desc()).all()
    return JobListOut(jobs=[_job_to_out(j, db) for j in jobs], total=len(jobs))


@router.post("/personal", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_personal_job(
    payload: JobCreate,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Create a personal tracked job visible only to the authenticated user."""
    clerk_user_id: str = current_user.get("sub") or ""
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing sub claim.")
    job = Job(
        business_id=None,
        clerk_user_id=clerk_user_id,
        is_personal=True,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        salary_range=payload.salary_range,
        skills_required=payload.skills_required,
        verified=False,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_to_out(job, db)


@router.delete("/personal/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_personal_job(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Delete a personal tracked job. Only the owner can delete it."""
    clerk_user_id: str = current_user.get("sub") or ""
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token: missing sub claim.")
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    job = db.query(Job).filter(Job.id == job_id, Job.clerk_user_id == clerk_user_id, Job.is_personal == True).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    db.delete(job)
    db.commit()


@router.get("", response_model=JobListOut)
def list_jobs(
    skill: Optional[str] = Query(None, description="Filter by required skill (case-insensitive substring)"),
    location: Optional[str] = Query(None, description="Filter by location (case-insensitive substring)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all verified public jobs. Personal jobs are excluded."""
    query = db.query(Job).filter(Job.verified == True, Job.is_personal == False)

    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))

    # Fetch all matching location/verified rows then filter by skill in Python
    # (avoids DB-specific JSON operators while staying portable)
    all_jobs: List[Job] = query.order_by(Job.created_at.desc()).all()

    if skill:
        skill_lower = skill.lower()
        all_jobs = [
            j for j in all_jobs
            if any(skill_lower in s.lower() for s in (j.skills_required or []))
        ]

    total = len(all_jobs)
    paged = all_jobs[offset: offset + limit]

    return JobListOut(jobs=[_job_to_out(j, db) for j in paged], total=total)


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobCreate,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Create a new job posting.  Requires a valid Clerk JWT.
    The posting is auto-verified for hackathon purposes.
    """
    clerk_user_id: str = current_user.get("sub", "")

    # Ensure the user has a registered business
    business = db.query(Business).filter(Business.clerk_user_id == clerk_user_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must register a business before posting jobs.",
        )

    job = Job(
        business_id=business.id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        salary_range=payload.salary_range,
        skills_required=payload.skills_required,
        # Hackathon shortcut: auto-verify all postings.
        verified=True,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_to_out(job, db)


@router.get("/{job_id}", response_model=JobOut)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
):
    """Return a single job by ID. Public endpoint — no authentication required.

    Personal jobs are never served here; callers should use GET /jobs/personal for those.
    """
    try:
        uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    job = db.query(Job).filter(Job.id == job_id, Job.is_personal == False).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return _job_to_out(job, db)


@router.post("/{job_id}/skills-gap", response_model=SkillsGapResponse)
def skills_gap(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Return a skills gap analysis comparing the authenticated user's profile
    against the required skills for the given job.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile via PUT /api/profile first.",
        )

    job_schema = _job_to_out(job, db)
    profile_schema = ProfileOut.model_validate(profile)
    language = getattr(profile, "preferred_language", "English") or "English"
    return analyze_skills_gap(profile_schema, job_schema, language=language)


@router.post("/{job_id}/interview-prep", response_model=InterviewPrepResponse)
def interview_prep(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Generate interview questions and answer frameworks for the authenticated user
    applying to the specified job.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile via PUT /api/profile first.",
        )

    job_schema = _job_to_out(job, db)
    profile_schema = ProfileOut.model_validate(profile)
    language = getattr(profile, "preferred_language", "English") or "English"
    return generate_interview_prep(job_schema, profile_schema, language=language)


@router.post("/{job_id}/translate", response_model=JargonTranslationResponse)
def translate_job_jargon(
    job_id: str,
    payload: JargonTranslateRequest,
    db: Session = Depends(get_db),
):
    """Translate workplace jargon in a job description. Public endpoint."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    language = payload.language or "English"
    return translate_jargon(job.description, language=language)


@router.post("/{job_id}/first-week-prep", response_model=FirstWeekPrepResponse)
def first_week_prep(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Generate first-week cultural prep tips for an immigrant starting this job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    language = getattr(profile, "preferred_language", "English") or "English" if profile else "English"

    job_schema = _job_to_out(job, db)
    return get_first_week_prep(job_schema, language=language)


@router.patch("/{job_id}/verify", response_model=JobOut)
def toggle_verify_job(
    job_id: str,
    x_admin_key: Optional[str] = Header(None, alias="X-Admin-Key"),
    db: Session = Depends(get_db),
):
    """
    Toggle the verified flag on a job.
    Protected by a simple secret header (X-Admin-Key) instead of full auth
    for hackathon simplicity.
    """
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing X-Admin-Key header.",
        )

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    job.verified = not job.verified
    db.commit()
    db.refresh(job)
    return _job_to_out(job, db)
