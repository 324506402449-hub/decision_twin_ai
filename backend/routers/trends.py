"""Router for career demand trends endpoint."""

from fastapi import APIRouter

from backend.models.schemas import DemandTrendsResponse, CareerTrendsResponse
from backend.services.gemini_service import fetch_demand_trends, fetch_career_trends

router = APIRouter(tags=["trends"])


@router.get("/career-demand-trends", response_model=DemandTrendsResponse)
async def get_career_demand_trends() -> DemandTrendsResponse:
    weeks = await fetch_demand_trends()
    return DemandTrendsResponse(weeks=weeks)


@router.get("/career-trends", response_model=CareerTrendsResponse)
async def get_career_trends() -> CareerTrendsResponse:
    data = await fetch_career_trends()
    return CareerTrendsResponse(**data)
