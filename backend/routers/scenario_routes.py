"""Router for scenario save / load endpoints."""

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.scenario_model import Scenario
from backend.models.schemas import (
    SaveScenarioRequest,
    SaveScenarioResponse,
    ScenarioDetailResponse,
    ScenarioSummary,
    ScenariosListResponse,
)

router = APIRouter(tags=["scenarios"])


@router.post("/save-scenario", response_model=SaveScenarioResponse)
def save_scenario(req: SaveScenarioRequest, db: Session = Depends(get_db)):
    scenario = Scenario(
        career_a=req.career_a,
        career_b=req.career_b,
        education_level=req.education_level,
        location_preference=req.location_preference,
        salary_graph_a=json.dumps(req.salary_graph_a),
        salary_graph_b=json.dumps(req.salary_graph_b),
        salary_growth_percent_a=req.salary_growth_percent_a,
        salary_growth_percent_b=req.salary_growth_percent_b,
        stability_a=req.stability_a,
        stability_b=req.stability_b,
        stress_a=req.stress_a,
        stress_b=req.stress_b,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return SaveScenarioResponse(message="Scenario saved successfully", id=scenario.id)


@router.get("/scenarios", response_model=ScenariosListResponse)
def list_scenarios(db: Session = Depends(get_db)):
    rows = db.query(Scenario).order_by(Scenario.created_at.desc()).all()
    items = [
        ScenarioSummary(
            id=r.id,
            career_a=r.career_a,
            career_b=r.career_b,
            education_level=r.education_level,
            location_preference=r.location_preference,
            created_at=r.created_at.strftime("%Y-%m-%d") if r.created_at else "",
        )
        for r in rows
    ]
    return ScenariosListResponse(scenarios=items)


@router.get("/scenario/{scenario_id}", response_model=ScenarioDetailResponse)
def get_scenario(scenario_id: int, db: Session = Depends(get_db)):
    row = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return ScenarioDetailResponse(
        id=row.id,
        career_a=row.career_a,
        career_b=row.career_b,
        education_level=row.education_level,
        location_preference=row.location_preference,
        salary_graph_a=json.loads(row.salary_graph_a),
        salary_graph_b=json.loads(row.salary_graph_b),
        salary_growth_percent_a=row.salary_growth_percent_a,
        salary_growth_percent_b=row.salary_growth_percent_b,
        stability_a=row.stability_a,
        stability_b=row.stability_b,
        stress_a=row.stress_a,
        stress_b=row.stress_b,
        created_at=row.created_at.strftime("%Y-%m-%d") if row.created_at else "",
    )


@router.delete("/scenario/{scenario_id}")
def delete_scenario(scenario_id: int, db: Session = Depends(get_db)):
    row = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Scenario not found")
    db.delete(row)
    db.commit()
    return {"message": "Scenario deleted successfully"}
