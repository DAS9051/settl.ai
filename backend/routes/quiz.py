import random
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from schemas import QuizEvaluateRequest, QuizEvaluationResponse, QuizGenerateRequest, QuizQuestion
from services.claude_service import evaluate_quiz_answer, generate_quiz_question

router = APIRouter(prefix="/quiz", tags=["quiz"])

QUIZ_CATEGORIES = [
    "Email etiquette",
    "Meeting norms",
    "Workplace dress code",
    "Jargon and slang",
    "Hierarchy and authority",
    "Time and punctuality",
]


@router.post("/question", response_model=QuizQuestion)
def get_quiz_question(payload: QuizGenerateRequest):
    """Generate a Canadian workplace culture quiz question."""
    category = payload.category
    if not category:
        category = random.choice(QUIZ_CATEGORIES)
    language = payload.language or "English"
    return generate_quiz_question(category=category, language=language)


@router.post("/evaluate", response_model=QuizEvaluationResponse)
def evaluate_answer(payload: QuizEvaluateRequest):
    """Evaluate the user's quiz answer and provide cultural feedback."""
    language = payload.language or "English"
    return evaluate_quiz_answer(
        question=payload.question,
        options=payload.options,
        selected_answer=payload.selected_answer,
        language=language,
    )
