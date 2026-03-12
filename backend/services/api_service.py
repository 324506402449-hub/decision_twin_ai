"""
External API service for fetching salary and career data.

Attempts to fetch from real APIs (BLS, etc.) and falls back to
curated dummy data when external calls fail or are unavailable.
"""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)
FALLBACK_SALARY_DATA: dict[str, dict] = {
    "data science": {
        "base_salary": 95_000,
        "growth_rate": 0.12,
        "stability": 90,
        "stress": "Low",
    },
    "data scientist": {
        "base_salary": 95_000,
        "growth_rate": 0.12,
        "stability": 90,
        "stress": "Low",
    },
    "software engineering": {
        "base_salary": 90_000,
        "growth_rate": 0.09,
        "stability": 78,
        "stress": "Medium",
    },
    "software engineer": {
        "base_salary": 90_000,
        "growth_rate": 0.09,
        "stability": 78,
        "stress": "Medium",
    },
    "machine learning engineer": {
        "base_salary": 105_000,
        "growth_rate": 0.13,
        "stability": 85,
        "stress": "Medium",
    },
    "ai engineer": {
        "base_salary": 110_000,
        "growth_rate": 0.14,
        "stability": 82,
        "stress": "Medium",
    },
    "data analyst": {
        "base_salary": 65_000,
        "growth_rate": 0.08,
        "stability": 88,
        "stress": "Low",
    },
    "deep learning engineer": {
        "base_salary": 115_000,
        "growth_rate": 0.13,
        "stability": 75,
        "stress": "High",
    },
    "mlops engineer": {
        "base_salary": 100_000,
        "growth_rate": 0.11,
        "stability": 80,
        "stress": "Medium",
    },
    "business intelligence analyst": {
        "base_salary": 70_000,
        "growth_rate": 0.07,
        "stability": 85,
        "stress": "Low",
    },
    "cloud ai engineer": {
        "base_salary": 108_000,
        "growth_rate": 0.12,
        "stability": 83,
        "stress": "Medium",
    },
    "computer vision engineer": {
        "base_salary": 112_000,
        "growth_rate": 0.13,
        "stability": 76,
        "stress": "High",
    },
    "nlp engineer": {
        "base_salary": 110_000,
        "growth_rate": 0.12,
        "stability": 78,
        "stress": "Medium",
    },
}
LOCATION_MULTIPLIERS: dict[str, float] = {
    "san francisco": 1.25,
    "new york": 1.20,
    "seattle": 1.15,
    "austin": 1.05,
    "bangalore": 0.45,
    "hyderabad": 0.40,
    "london": 1.10,
    "remote": 1.00,
}
EDUCATION_MULTIPLIERS: dict[str, float] = {
    "bachelor's degree": 1.00,
    "master's degree": 1.12,
    "phd": 1.25,
    "bootcamp": 0.90,
    "self taught": 0.85,
    "self-taught": 0.85,
}
BLS_SERIES_MAP: dict[str, str] = {
    "data science": "OEUM003100000015125103",
    "software engineering": "OEUM003100000015113200",
}

BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"


async def fetch_bls_salary(career: str) -> Optional[int]:
    """Try fetching median salary from BLS public API (v2, no key)."""
    series_id = BLS_SERIES_MAP.get(career.lower())
    if not series_id:
        return None

    payload = {
        "seriesid": [series_id],
        "startyear": "2023",
        "endyear": "2024",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(BLS_API_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()

        series = data.get("Results", {}).get("series", [])
        if series and series[0].get("data"):
            value_str = series[0]["data"][0].get("value", "")
            return int(float(value_str))
    except Exception as exc:
        logger.warning("BLS API call failed for %s: %s", career, exc)

    return None


async def get_career_data(career: str) -> dict:
    """
    Return salary / career metrics for a career name.
    Tries BLS first, then falls back to curated data.
    """
    key = career.strip().lower()
    bls_salary = await fetch_bls_salary(career)

    fallback = FALLBACK_SALARY_DATA.get(key)
    if fallback:
        base = bls_salary if bls_salary else fallback["base_salary"]
        return {
            "base_salary": base,
            "growth_rate": fallback["growth_rate"],
            "stability": fallback["stability"],
            "stress": fallback["stress"],
        }
    base = bls_salary if bls_salary else 75_000
    return {
        "base_salary": base,
        "growth_rate": 0.08,
        "stability": 70,
        "stress": "Medium",
    }


def get_location_multiplier(location: str) -> float:
    return LOCATION_MULTIPLIERS.get(location.strip().lower(), 1.00)


def get_education_multiplier(education: str) -> float:
    return EDUCATION_MULTIPLIERS.get(education.strip().lower(), 1.00)
