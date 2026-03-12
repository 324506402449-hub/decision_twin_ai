"""SQLAlchemy model for saved scenarios."""

import json
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, Text, DateTime

from backend.models.database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    career_a = Column(String, nullable=False)
    career_b = Column(String, nullable=False)
    education_level = Column(String, nullable=False)
    location_preference = Column(String, nullable=False)
    salary_graph_a = Column(Text, nullable=False)
    salary_graph_b = Column(Text, nullable=False)

    salary_growth_percent_a = Column(Float, nullable=False)
    salary_growth_percent_b = Column(Float, nullable=False)

    stability_a = Column(Float, nullable=False)
    stability_b = Column(Float, nullable=False)

    stress_a = Column(Float, nullable=False)
    stress_b = Column(Float, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def set_salary_graph_a(self, values: list[int]):
        self.salary_graph_a = json.dumps(values)

    def get_salary_graph_a(self) -> list[int]:
        return json.loads(self.salary_graph_a)

    def set_salary_graph_b(self, values: list[int]):
        self.salary_graph_b = json.dumps(values)

    def get_salary_graph_b(self) -> list[int]:
        return json.loads(self.salary_graph_b)
