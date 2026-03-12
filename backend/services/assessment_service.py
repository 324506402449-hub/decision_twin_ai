"""Service for 4-phase assessment system."""

from sqlalchemy.orm import Session
from backend.models.assessment_model import Assessment
from backend.models.schemas import SubmitAssessmentRequest, AssessmentResultResponse


def submit_assessment(db: Session, request: SubmitAssessmentRequest) -> Assessment:
    """Submit and save assessment results."""
    
    # Calculate final score (average of all phases)
    phase_scores = [
        (request.mcq_score / request.mcq_max_score) * 0.25,
        (request.coding_score / request.coding_max_score) * 0.25,
        (request.debugging_score / request.debugging_max_score) * 0.25,
        (request.problem_solving_score / request.problem_solving_max_score) * 0.25,
    ]
    final_score = sum(phase_scores) * 100
    
    # Determine skill level
    if final_score >= 75:
        skill_level = "Advanced"
    elif final_score >= 50:
        skill_level = "Intermediate"
    else:
        skill_level = "Beginner"
    
    # Generate strengths and weaknesses based on scores
    strengths = generate_strengths(
        request.mcq_score / request.mcq_max_score,
        request.coding_score / request.coding_max_score,
        request.debugging_score / request.debugging_max_score,
        request.problem_solving_score / request.problem_solving_max_score,
    )
    
    weaknesses = generate_weaknesses(
        request.mcq_score / request.mcq_max_score,
        request.coding_score / request.coding_max_score,
        request.debugging_score / request.debugging_max_score,
        request.problem_solving_score / request.problem_solving_max_score,
    )
    
    recommendations = generate_recommendations(skill_level, weaknesses)
    
    ai_feedback = generate_ai_feedback(
        final_score,
        skill_level,
        request.mcq_score / request.mcq_max_score,
        request.coding_score / request.coding_max_score,
        request.debugging_score / request.debugging_max_score,
        request.problem_solving_score / request.problem_solving_max_score,
    )
    
    # Create assessment record
    assessment = Assessment(
        student_name=request.student_name,
        student_email=request.student_email,
        
        mcq_score=request.mcq_score,
        mcq_max_score=request.mcq_max_score,
        
        coding_score=request.coding_score,
        coding_max_score=request.coding_max_score,
        
        debugging_score=request.debugging_score,
        debugging_max_score=request.debugging_max_score,
        
        problem_solving_score=request.problem_solving_score,
        problem_solving_max_score=request.problem_solving_max_score,
        
        final_score=final_score,
        skill_level=skill_level,
        
        ai_feedback=ai_feedback,
    )
    
    # Set JSON details if provided
    if request.mcq_details:
        assessment.set_mcq_details(request.mcq_details)
    if request.coding_details:
        assessment.set_coding_details(request.coding_details)
    if request.debugging_details:
        assessment.set_debugging_details(request.debugging_details)
    if request.problem_solving_details:
        assessment.set_problem_solving_details(request.problem_solving_details)
    
    assessment.set_resume_skills(request.resume_skills)
    assessment.set_strengths(strengths)
    assessment.set_weaknesses(weaknesses)
    assessment.set_recommendations(recommendations)
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return assessment


def get_assessment(db: Session, assessment_id: int) -> Assessment:
    """Get assessment by ID."""
    return db.query(Assessment).filter(Assessment.id == assessment_id).first()


def get_all_assessments(db: Session, skip: int = 0, limit: int = 100) -> list[Assessment]:
    """Get all assessments with pagination."""
    return db.query(Assessment).offset(skip).limit(limit).all()


def get_assessment_stats(db: Session) -> dict:
    """Get statistics of all assessments."""
    assessments = db.query(Assessment).all()
    
    if not assessments:
        return {
            "total_assessments": 0,
            "average_final_score": 0,
            "average_mcq_score": 0,
            "average_coding_score": 0,
            "average_debugging_score": 0,
            "average_problem_solving_score": 0,
            "skill_level_distribution": {}
        }
    
    total = len(assessments)
    avg_final = sum(a.final_score for a in assessments) / total if assessments else 0
    avg_mcq = sum(a.mcq_score for a in assessments) / total if assessments else 0
    avg_coding = sum(a.coding_score for a in assessments) / total if assessments else 0
    avg_debugging = sum(a.debugging_score for a in assessments) / total if assessments else 0
    avg_problem_solving = sum(a.problem_solving_score for a in assessments) / total if assessments else 0
    
    # Calculate skill level distribution
    distribution = {"Beginner": 0, "Intermediate": 0, "Advanced": 0}
    for assessment in assessments:
        distribution[assessment.skill_level] += 1
    
    return {
        "total_assessments": total,
        "average_final_score": round(avg_final, 2),
        "average_mcq_score": round(avg_mcq, 2),
        "average_coding_score": round(avg_coding, 2),
        "average_debugging_score": round(avg_debugging, 2),
        "average_problem_solving_score": round(avg_problem_solving, 2),
        "skill_level_distribution": distribution
    }


def generate_strengths(mcq_rate: float, coding_rate: float, debug_rate: float, problem_rate: float) -> list[str]:
    """Generate strengths based on performance."""
    strengths = []
    
    if mcq_rate >= 0.75:
        strengths.append("Strong theoretical knowledge")
    if coding_rate >= 0.75:
        strengths.append("Excellent coding ability")
    if debug_rate >= 0.75:
        strengths.append("Outstanding debugging skills")
    if problem_rate >= 0.75:
        strengths.append("Exceptional problem-solving")
    if (mcq_rate + coding_rate + debug_rate + problem_rate) / 4 >= 0.8:
        strengths.append("Overall strong technical foundation")
    
    if not strengths:
        strengths = ["Solid understanding of fundamentals", "Good learning potential"]
    
    return strengths


def generate_weaknesses(mcq_rate: float, coding_rate: float, debug_rate: float, problem_rate: float) -> list[str]:
    """Generate weaknesses based on performance."""
    weaknesses = []
    
    if mcq_rate < 0.5:
        weaknesses.append("Need to improve theoretical knowledge")
    if coding_rate < 0.5:
        weaknesses.append("Requires more coding practice")
    if debug_rate < 0.5:
        weaknesses.append("Debugging skills need development")
    if problem_rate < 0.5:
        weaknesses.append("Complex problem-solving needs work")
    
    if not weaknesses:
        weaknesses = ["Focus on advanced topics", "Explore specialized domains"]
    
    return weaknesses


def generate_recommendations(skill_level: str, weaknesses: list[str]) -> list[str]:
    """Generate improvement recommendations."""
    recommendations = []
    
    if skill_level == "Beginner":
        recommendations = [
            "Start with fundamental programming concepts",
            "Practice basic data structures and algorithms",
            "Build small projects to reinforce learning",
            "Focus on code quality and best practices",
            "Solve more problem sets on competitive platforms"
        ]
    elif skill_level == "Intermediate":
        recommendations = [
            "Deepen understanding of design patterns",
            "Learn advanced algorithms and optimization techniques",
            "Work on medium-complexity projects",
            "Study system design principles",
            "Contribute to open-source projects"
        ]
    else:  # Advanced
        recommendations = [
            "Explore specialized domains (ML, DevOps, etc.)",
            "Study advanced architectural patterns",
            "Mentor junior developers",
            "Contribute to challenging projects",
            "Stay updated with latest technologies"
        ]
    
    return recommendations


def generate_ai_feedback(final_score: float, skill_level: str, mcq_rate: float, coding_rate: float, debug_rate: float, problem_rate: float) -> str:
    """Generate personalized AI feedback."""
    
    feedback = f"Your overall assessment score is {final_score:.1f}%, indicating a {skill_level} level "
    feedback += "of technical proficiency. "
    
    # Add phase-specific feedback
    phases_feedback = []
    
    if mcq_rate >= 0.8:
        phases_feedback.append("Your strong performance in theoretical knowledge shows solid conceptual understanding.")
    elif mcq_rate >= 0.6:
        phases_feedback.append("Your theoretical foundation is good but reviewing advanced concepts could help.")
    else:
        phases_feedback.append("Focus on strengthening your theoretical knowledge through structured learning.")
    
    if coding_rate >= 0.8:
        phases_feedback.append("Your coding skills are excellent - you demonstrate strong implementation ability.")
    elif coding_rate >= 0.6:
        phases_feedback.append("Your coding skills are decent but practice with more complex challenges would help.")
    else:
        phases_feedback.append("Coding practice is essential - focus on implementing solutions regularly.")
    
    if debug_rate >= 0.8:
        phases_feedback.append("Exceptional debugging abilities show you can efficiently identify and fix issues.")
    elif debug_rate >= 0.6:
        phases_feedback.append("Good debugging skills - more practice will improve your efficiency.")
    else:
        phases_feedback.append("Develop debugging skills by working through more exercises systematically.")
    
    if problem_rate >= 0.8:
        phases_feedback.append("Outstanding system design thinking - you grasp complex problem requirements well.")
    elif problem_rate >= 0.6:
        phases_feedback.append("Good problem-solving approach - studying architecture patterns would enhance skills.")
    else:
        phases_feedback.append("System design requires practice - study real-world architectures and patterns.")
    
    feedback += " ".join(phases_feedback)
    
    if skill_level == "Advanced":
        feedback += " You're ready for senior roles and should focus on leadership and specialized expertise."
    elif skill_level == "Intermediate":
        feedback += " With continued practice, you'll advance to expert level. Focus on depth in specific areas."
    else:
        feedback += " Consistent practice and structured learning will help you reach intermediate level soon."
    
    return feedback
