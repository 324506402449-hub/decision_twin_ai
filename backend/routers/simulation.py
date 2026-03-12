"""Router for the /simulate endpoint – powered by Gemini AI."""

from fastapi import APIRouter, HTTPException

from backend.models.schemas import SimulationRequest, SimulationResponse, CareerResult
from backend.services.gemini_service import fetch_simulation

router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulationResponse)
async def run_simulation(req: SimulationRequest) -> SimulationResponse:
    try:
        data = await fetch_simulation(
            career_a=req.career_option_a,
            career_b=req.career_option_b,
            education_level=req.education_level,
            location=req.location,
            risk_tolerance=req.risk_tolerance,
        )

        career_a = CareerResult(**data["career_a"])
        career_b = CareerResult(**data["career_b"])
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Simulation failed: {exc}",
        ) from exc

    return SimulationResponse(career_a=career_a, career_b=career_b)
