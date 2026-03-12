"""API routes for 4-phase assessment system."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.schemas import (
    SubmitAssessmentRequest,
    AssessmentResultResponse,
    AssessmentListResponse,
    AssessmentStatsResponse,
)
from backend.services.assessment_service import (
    submit_assessment,
    get_assessment,
    get_all_assessments,
    get_assessment_stats,
)

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


@router.post("/submit", response_model=AssessmentResultResponse)
def submit_assessment_endpoint(
    request: SubmitAssessmentRequest,
    db: Session = Depends(get_db)
):
    """Submit assessment results and store in database."""
    try:
        assessment = submit_assessment(db, request)
        return AssessmentResultResponse.model_validate(assessment)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{assessment_id}", response_model=AssessmentResultResponse)
def get_assessment_endpoint(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """Get assessment results by ID."""
    assessment = get_assessment(db, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return AssessmentResultResponse.model_validate(assessment)


@router.get("", response_model=AssessmentListResponse)
def get_assessments_endpoint(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all assessments with pagination."""
    assessments = get_all_assessments(db, skip, limit)
    return AssessmentListResponse(
        assessments=[AssessmentResultResponse.model_validate(a) for a in assessments]
    )


@router.get("/stats/overview", response_model=AssessmentStatsResponse)
def get_assessment_stats_endpoint(db: Session = Depends(get_db)):
    """Get assessment statistics."""
    stats = get_assessment_stats(db)
    return AssessmentStatsResponse(**stats)
