from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.profile import Profile
from schemas import ProfileCreate, ProfileOut
from services.auth import get_current_user_dep

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Return the authenticated user's career profile."""
    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Use PUT /api/profile to create one.",
        )
    return ProfileOut.model_validate(profile)


@router.put("", response_model=ProfileOut)
def upsert_profile(
    payload: ProfileCreate,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Create or fully replace the authenticated user's career profile."""
    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()

    if profile:
        profile.skills = payload.skills
        profile.education = payload.education
        profile.certifications = payload.certifications
        profile.experience = payload.experience
        profile.target_roles = payload.target_roles
        profile.preferred_language = payload.preferred_language
        profile.updated_at = datetime.now(timezone.utc)
    else:
        profile = Profile(
            clerk_user_id=clerk_user_id,
            skills=payload.skills,
            education=payload.education,
            certifications=payload.certifications,
            experience=payload.experience,
            target_roles=payload.target_roles,
            preferred_language=payload.preferred_language,
            updated_at=datetime.now(timezone.utc),
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return ProfileOut.model_validate(profile)
