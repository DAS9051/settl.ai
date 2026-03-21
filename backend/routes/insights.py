from fastapi import APIRouter

from schemas import SalaryInsightRequest, SalaryInsightResponse
from services.claude_service import get_salary_insight

router = APIRouter(prefix="/insights", tags=["insights"])


@router.post("/salary", response_model=SalaryInsightResponse)
def salary_insights(payload: SalaryInsightRequest):
    """
    Return an estimated salary range for a given role, location, and skills.
    Public endpoint — no authentication required.
    """
    return get_salary_insight(payload.role, payload.location, payload.skills)
