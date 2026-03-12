"""Router for career reference-data endpoints – powered by Gemini AI."""

from fastapi import APIRouter

from backend.models.schemas import (
    CareerOptionsResponse,
    EducationLevelsResponse,
    LocationsResponse,
)
from backend.services.gemini_service import fetch_career_options, fetch_demanding_skills

router = APIRouter(tags=["careers"])


@router.get("/demanding-skills")
async def get_demanding_skills():
    """AI-predicted most in-demand full-time and part-time skills."""
    return await fetch_demanding_skills()


@router.get("/career-options", response_model=CareerOptionsResponse)
async def get_career_options() -> CareerOptionsResponse:
    careers = await fetch_career_options()
    return CareerOptionsResponse(careers=careers)


@router.get("/education-levels", response_model=EducationLevelsResponse)
async def get_education_levels() -> EducationLevelsResponse:
    return EducationLevelsResponse(
        education_levels=[
            "Bachelor's Degree",
            "Master's Degree",
            "PhD",
            "Bootcamp",
            "Self Taught",
        ]
    )


@router.get("/locations", response_model=LocationsResponse)
async def get_locations() -> LocationsResponse:
    return LocationsResponse(
        locations=[
            "San Francisco",
            "New York",
            "Seattle",
            "Austin",
            "Los Angeles",
            "Chicago",
            "Boston",
            "Denver",
            "Washington D.C.",
            "Toronto",
            "Vancouver",
            "London",
            "Berlin",
            "Amsterdam",
            "Paris",
            "Dublin",
            "Zurich",
            "Singapore",
            "Tokyo",
            "Sydney",
            "Melbourne",
            "Dubai",
            "Bangalore",
            "Hyderabad",
            "Mumbai",
            "Chennai",
            "Pune",
            "Delhi NCR",
            "Tel Aviv",
            "Shanghai",
            "Beijing",
            "Seoul",
            "Remote",
        ]
    )
