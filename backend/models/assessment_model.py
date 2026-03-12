"""SQLAlchemy model for 4-phase assessment system."""

import json
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime

from backend.models.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Student info
    student_name = Column(String, nullable=True)
    student_email = Column(String, nullable=True)
    
    # Phase results
    mcq_score = Column(Float, nullable=False, default=0)
    mcq_max_score = Column(Float, nullable=False, default=10)
    
    coding_score = Column(Float, nullable=False, default=0)
    coding_max_score = Column(Float, nullable=False, default=3)
    
    debugging_score = Column(Float, nullable=False, default=0)
    debugging_max_score = Column(Float, nullable=False, default=5)
    
    problem_solving_score = Column(Float, nullable=False, default=0)
    problem_solving_max_score = Column(Float, nullable=False, default=2)
    
    # Overall results
    final_score = Column(Float, nullable=False, default=0)
    skill_level = Column(String, nullable=False, default="Beginner")  # Beginner, Intermediate, Advanced
    
    # Detail JSON storage
    mcq_details = Column(Text, nullable=True)  # JSON string with question-by-question results
    coding_details = Column(Text, nullable=True)  # JSON string with challenge solutions
    debugging_details = Column(Text, nullable=True)  # JSON string with debug exercise fixes
    problem_solving_details = Column(Text, nullable=True)  # JSON string with scenario solutions
    
    strengths = Column(Text, nullable=True)  # JSON array
    weaknesses = Column(Text, nullable=True)  # JSON array
    recommendations = Column(Text, nullable=True)  # JSON array
    ai_feedback = Column(Text, nullable=True)  # Text feedback
    
    # Resume skills for context
    resume_skills = Column(Text, nullable=True)  # JSON array
    
    # Metadata
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Helper methods
    def set_mcq_details(self, data: dict):
        self.mcq_details = json.dumps(data)
    
    def get_mcq_details(self) -> dict:
        if self.mcq_details:
            return json.loads(self.mcq_details)
        return {}
    
    def set_coding_details(self, data: dict):
        self.coding_details = json.dumps(data)
    
    def get_coding_details(self) -> dict:
        if self.coding_details:
            return json.loads(self.coding_details)
        return {}
    
    def set_debugging_details(self, data: dict):
        self.debugging_details = json.dumps(data)
    
    def get_debugging_details(self) -> dict:
        if self.debugging_details:
            return json.loads(self.debugging_details)
        return {}
    
    def set_problem_solving_details(self, data: dict):
        self.problem_solving_details = json.dumps(data)
    
    def get_problem_solving_details(self) -> dict:
        if self.problem_solving_details:
            return json.loads(self.problem_solving_details)
        return {}
    
    def set_resume_skills(self, skills: list):
        self.resume_skills = json.dumps(skills)
    
    def get_resume_skills(self) -> list:
        if self.resume_skills:
            return json.loads(self.resume_skills)
        return []
    
    def set_strengths(self, strengths: list):
        self.strengths = json.dumps(strengths)
    
    def get_strengths(self) -> list:
        if self.strengths:
            return json.loads(self.strengths)
        return []
    
    def set_weaknesses(self, weaknesses: list):
        self.weaknesses = json.dumps(weaknesses)
    
    def get_weaknesses(self) -> list:
        if self.weaknesses:
            return json.loads(self.weaknesses)
        return []
    
    def set_recommendations(self, recommendations: list):
        self.recommendations = json.dumps(recommendations)
    
    def get_recommendations(self) -> list:
        if self.recommendations:
            return json.loads(self.recommendations)
        return []
