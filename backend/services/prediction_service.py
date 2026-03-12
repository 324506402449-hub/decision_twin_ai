"""
Prediction service – computes 5-year salary growth, stability, and stress
from raw career data + user parameters (education, location, risk tolerance).
"""

from backend.services.api_service import (
    get_career_data,
    get_education_multiplier,
    get_location_multiplier,
)
from backend.models.schemas import CareerResult


async def predict_career(
    career_name: str,
    education_level: str,
    location: str,
    risk_tolerance: float,
) -> CareerResult:
    """Build a CareerResult for a single career option."""

    raw = await get_career_data(career_name)

    edu_mult = get_education_multiplier(education_level)
    loc_mult = get_location_multiplier(location)

    base = raw["base_salary"] * edu_mult * loc_mult
    adjusted_growth = raw["growth_rate"] * (1 + 0.3 * (risk_tolerance - 0.5))
    salary_growth: list[int] = []
    current = base
    for _ in range(5):
        salary_growth.append(int(round(current / 1000) * 1000))
        current *= 1 + adjusted_growth

    five_year_salary = salary_growth[-1]
    stability = max(0, min(100, int(raw["stability"] - 5 * (risk_tolerance - 0.5))))

    stress = raw["stress"]

    return CareerResult(
        name=career_name,
        five_year_salary=five_year_salary,
        stability=stability,
        stress=stress,
        salary_growth=salary_growth,
    )
