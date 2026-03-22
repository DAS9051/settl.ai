from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.profile import Profile
from schemas import OutreachRequest, OutreachResponse, ProfileOut
from services.auth import get_current_user_dep
from services.claude_service import generate_outreach_message
from schemas import JobOut

router = APIRouter(prefix="/outreach", tags=["outreach"])


@router.post("", response_model=OutreachResponse)
def generate_outreach(
    payload: OutreachRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Generate a cold outreach email from a pasted job description."""
    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile first.",
        )

    profile_schema = ProfileOut.model_validate(profile)
    language = profile.preferred_language or "English"

    # Build a minimal JobOut-like object from the pasted text
    import uuid as _uuid
    from datetime import datetime
    job = JobOut(
        id=_uuid.uuid4(),
        title=payload.job_title,
        description=payload.job_description,
        business_name=payload.company_name,
        location="Canada",
        salary_range=None,
        skills_required=[],
        verified=False,
        created_at=datetime.utcnow(),
    )

    return generate_outreach_message(job, profile_schema, language=language)
