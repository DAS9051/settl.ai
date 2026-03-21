from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.job import Job
from models.profile import Profile
from schemas import CounselResponse, JobOut, ProfileOut
from services.auth import get_current_user_dep
from services.claude_service import get_career_counsel

router = APIRouter(prefix="/counsel", tags=["counsel"])


def _jobs_matching_profile(profile: Profile, db: Session) -> List[Job]:
    """
    Return verified jobs that overlap with the profile's target roles or skills.

    Strategy (portable, no DB-specific JSON operators):
      1. Fetch all verified jobs.
      2. Filter in Python by checking whether any target role appears in the
         job title (case-insensitive) OR any profile skill appears in the
         job's skills_required list.
    """
    all_jobs: List[Job] = db.query(Job).filter(Job.verified == True).all()

    target_roles_lower = [r.lower() for r in (profile.target_roles or [])]
    profile_skills_lower = [s.lower() for s in (profile.skills or [])]

    matches = []
    for job in all_jobs:
        job_title_lower = job.title.lower()
        job_skills_lower = [s.lower() for s in (job.skills_required or [])]

        role_match = any(role in job_title_lower for role in target_roles_lower)
        skill_match = any(skill in job_skills_lower for skill in profile_skills_lower)

        if role_match or skill_match:
            matches.append(job)

    return matches


@router.post("", response_model=CounselResponse)
def run_counsel(
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Run the AI career counselor for the authenticated user.

    Steps:
    1. Load the user's profile from the database.
    2. Find jobs that match their target roles or skills.
    3. Call Claude to generate a personalised roadmap and recommendations.
    4. Return the structured CounselResponse.
    """
    clerk_user_id: str = current_user.get("sub", "")

    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile via PUT /api/profile first.",
        )

    matching_jobs = _jobs_matching_profile(profile, db)
    job_schemas = [JobOut.model_validate(j) for j in matching_jobs]
    profile_schema = ProfileOut.model_validate(profile)

    result: CounselResponse = get_career_counsel(profile_schema, job_schemas)
    return result
