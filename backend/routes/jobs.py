import os
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from models.business import Business
from models.job import Job
from models.profile import Profile
from schemas import JobCreate, JobListOut, JobOut, ProfileOut, SkillsGapResponse
from services.auth import get_current_user_dep
from services.claude_service import analyze_skills_gap

router = APIRouter(prefix="/jobs", tags=["jobs"])

ADMIN_KEY = os.environ.get("ADMIN_KEY", "hackathon-admin-secret")


def _job_to_out(job: Job, db: Session) -> JobOut:
    """Convert a Job ORM object to JobOut, populating business_name."""
    out = JobOut.model_validate(job)
    business = db.query(Business).filter(Business.id == job.business_id).first()
    if business:
        out.business_name = business.name
    return out


@router.get("", response_model=JobListOut)
def list_jobs(
    skill: Optional[str] = Query(None, description="Filter by required skill (case-insensitive substring)"),
    location: Optional[str] = Query(None, description="Filter by location (case-insensitive substring)"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List all verified jobs. Public endpoint — no authentication required."""
    query = db.query(Job).filter(Job.verified == True)

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
    """Return a single job by ID. Public endpoint — no authentication required."""
    job = db.query(Job).filter(Job.id == job_id).first()
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
    return analyze_skills_gap(profile_schema, job_schema)


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
