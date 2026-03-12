"""Career roadmap generation endpoint."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class RoadmapRequest(BaseModel):
    primary_career: str = Field(..., min_length=1)
    secondary_career: str = ""
    third_career: str = ""
    focus_mode: str = Field(..., pattern=r"^(one_focus|two_alternating|three_simultaneous)$")
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    schedule_style: str = Field(default="full_day", pattern=r"^(morning|evening|full_day)$")


@router.post("/generate-career-roadmap")
async def generate_career_roadmap(req: RoadmapRequest):
    """Generate an AI-powered career roadmap with mind map and daily schedule."""
    from backend.services.gemini_service import fetch_career_roadmap

    try:
        result = await fetch_career_roadmap(
            primary_career=req.primary_career,
            secondary_career=req.secondary_career,
            third_career=req.third_career,
            focus_mode=req.focus_mode,
            start_date=req.start_date,
            end_date=req.end_date,
            schedule_style=req.schedule_style,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
