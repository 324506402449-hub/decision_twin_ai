"""Decision Twin AI – FastAPI backend entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.models.database import Base, engine
from backend.models.scenario_model import Scenario  # noqa: F401 – registers table
from backend.models.assessment_model import Assessment  # noqa: F401 – registers table
from backend.routers import careers, simulation, scenario_routes, trends, roadmap, chat, resume_analysis, assessment

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Decision Twin AI",
    description="AI Career Decision Simulator API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(careers.router)
app.include_router(simulation.router)
app.include_router(scenario_routes.router)
app.include_router(trends.router)
app.include_router(roadmap.router)
app.include_router(chat.router)
app.include_router(resume_analysis.router)
app.include_router(assessment.router)


@app.get("/")
async def health():
    return {"status": "ok", "service": "Decision Twin AI Backend"}
