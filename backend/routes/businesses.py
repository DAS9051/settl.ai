import re
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.business import Business
from schemas import BusinessCreate, BusinessOut

from services.auth import get_current_user_dep

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.post("", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
def register_business(
    payload: BusinessCreate,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Register a new business for the authenticated user.
    Each Clerk user can own at most one business.
    """
    clerk_user_id: str = current_user.get("sub", "")

    is_valid_bn = bool(
        payload.business_number
        and re.match(r'^\d{9}', payload.business_number.strip())
    )

    existing = db.query(Business).filter(Business.clerk_user_id == clerk_user_id).first()
    if existing:
        existing.name = payload.name
        existing.contact_email = payload.contact_email
        existing.business_number = payload.business_number
        existing.verified = is_valid_bn
        db.commit()
        db.refresh(existing)
        return BusinessOut.model_validate(existing)

    business = Business(
        clerk_user_id=clerk_user_id,
        name=payload.name,
        contact_email=payload.contact_email,
        business_number=payload.business_number,
        verified=is_valid_bn,
    )
    db.add(business)
    db.commit()
    db.refresh(business)
    return BusinessOut.model_validate(business)


@router.get("/me", response_model=BusinessOut)
def get_my_business(
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """Return the business registered by the authenticated user."""
    clerk_user_id: str = current_user.get("sub", "")
    business = db.query(Business).filter(Business.clerk_user_id == clerk_user_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No business found for this account.",
        )
    return BusinessOut.model_validate(business)
