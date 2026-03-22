from typing import Dict, Any

from fastapi import APIRouter, Depends

from schemas import PaycheckExplanation, PaycheckRequest
from services.auth import get_current_user_dep
from services.paycheck_calculator import calculate_paycheck

router = APIRouter(prefix="/paycheck", tags=["paycheck"])


@router.post("/explain", response_model=PaycheckExplanation)
def explain_paycheck_endpoint(
    payload: PaycheckRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
):
    """Explain Canadian paycheck deductions for a given gross salary and province."""
    return calculate_paycheck(payload.salary, payload.province)
