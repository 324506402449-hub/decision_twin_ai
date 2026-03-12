from datetime import datetime

from pydantic import BaseModel, Field
from typing import Literal, Optional


class SimulationRequest(BaseModel):
    career_option_a: str = Field(..., min_length=1, max_length=200, examples=["Data Science"])
    career_option_b: str = Field(..., min_length=1, max_length=200, examples=["Software Engineering"])
    education_level: str = Field(..., examples=["Bachelor's Degree"])
    location: str = Field(..., examples=["San Francisco"])
    risk_tolerance: float = Field(..., ge=0.0, le=1.0, examples=[0.6])


class CareerResult(BaseModel):
    name: str
    five_year_salary: int
    stability: int
    stress: Literal["Low", "Medium", "High"]
    salary_growth: list[int] = Field(..., min_length=5, max_length=5)


class SimulationResponse(BaseModel):
    career_a: CareerResult
    career_b: CareerResult


class CareerOptionsResponse(BaseModel):
    careers: list[str]


class EducationLevelsResponse(BaseModel):
    education_levels: list[str]


class LocationsResponse(BaseModel):
    locations: list[str]



class SaveScenarioRequest(BaseModel):
    career_a: str = Field(..., min_length=1, max_length=200)
    career_b: str = Field(..., min_length=1, max_length=200)
    education_level: str = Field(..., max_length=100)
    location_preference: str = Field(..., max_length=100)

    salary_graph_a: list[int] = Field(..., min_length=5, max_length=5)
    salary_graph_b: list[int] = Field(..., min_length=5, max_length=5)

    salary_growth_percent_a: float
    salary_growth_percent_b: float

    stability_a: float
    stability_b: float

    stress_a: float
    stress_b: float


class SaveScenarioResponse(BaseModel):
    message: str
    id: int


class ScenarioSummary(BaseModel):
    id: int
    career_a: str
    career_b: str
    education_level: str
    location_preference: str
    created_at: str


class ScenariosListResponse(BaseModel):
    scenarios: list[ScenarioSummary]


class ScenarioDetailResponse(BaseModel):
    id: int
    career_a: str
    career_b: str
    education_level: str
    location_preference: str

    salary_graph_a: list[int]
    salary_graph_b: list[int]

    salary_growth_percent_a: float
    salary_growth_percent_b: float

    stability_a: float
    stability_b: float

    stress_a: float
    stress_b: float

    created_at: str



class CareerDemand(BaseModel):
    name: str
    demand: int


class WeekData(BaseModel):
    week: int
    careers: list[CareerDemand]


class DemandTrendsResponse(BaseModel):
    weeks: list[WeekData]



class WeeklyDemandDay(BaseModel):
    day: str
    values: dict[str, int]  # career_name -> demand score


class SkillDemand(BaseModel):
    name: str
    percent: int
    salary: int


class CareerTrendsResponse(BaseModel):
    weekly_career_demand: list[dict]
    career_trend_lines: dict[str, list[int]]
    most_demanded_skills: list[SkillDemand]


# ============================================================================
# ASSESSMENT SCHEMAS
# ============================================================================

class AssessmentPhaseScore(BaseModel):
    phase: int
    score: float
    max_score: float


class SubmitAssessmentRequest(BaseModel):
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    resume_skills: list[str] = []
    
    mcq_score: float
    mcq_max_score: float
    
    coding_score: float
    coding_max_score: float
    
    debugging_score: float
    debugging_max_score: float
    
    problem_solving_score: float
    problem_solving_max_score: float
    
    mcq_details: Optional[dict] = None
    coding_details: Optional[dict] = None
    debugging_details: Optional[dict] = None
    problem_solving_details: Optional[dict] = None


class AssessmentResultResponse(BaseModel):
    id: int
    student_name: Optional[str]
    student_email: Optional[str]
    
    mcq_score: float
    mcq_max_score: float
    
    coding_score: float
    coding_max_score: float
    
    debugging_score: float
    debugging_max_score: float
    
    problem_solving_score: float
    problem_solving_max_score: float
    
    final_score: float
    skill_level: str
    
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    ai_feedback: Optional[str]
    
    resume_skills: list[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AssessmentListResponse(BaseModel):
    assessments: list[AssessmentResultResponse]


class AssessmentStatsResponse(BaseModel):
    total_assessments: int
    average_final_score: float
    average_mcq_score: float
    average_coding_score: float
    average_debugging_score: float
    average_problem_solving_score: float
    skill_level_distribution: dict[str, int]  # {"Beginner": 5, "Intermediate": 3, "Advanced": 1}

