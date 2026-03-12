"""
Resume Analysis Service – analyzes student resumes using Gemini API.

Converts resume data into Dashboard-compatible format.
"""

import json
import logging
import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise RuntimeError("GEMINI_API_KEY is not set. Add it to backend/.env")

genai.configure(api_key=_api_key)

MODEL_NAME = "gemini-2.0-flash"
MAX_RETRIES = 2


async def analyze_resume_for_dashboard(resume_text: str) -> dict:
    """
    Analyze resume and return data in Dashboard-compatible format using Google Gemini AI.
    
    Args:
        resume_text: The resume content as text
    
    Returns:
        Dictionary with dashboard metrics
    """
    
    analysis_prompt = """You are an AI career analysis engine.

Your task is to analyze the provided student CV/Resume and extract structured information that can populate a Student Career Dashboard.

Read the entire document carefully and return ONLY structured JSON data.

Analyze the resume and extract the following:

1. Basic Information
- name
- education
- degree
- university
- graduation_year
- country

2. Skills Analysis
Identify:
- programming_languages
- frameworks
- tools
- databases
- cloud_platforms
- soft_skills

Also calculate:
- top_5_strongest_skills
- skill_proficiency_estimate (0–100)

3. Career Prediction
Based on the resume skills and experience predict:
- best_career_role
- career_match_score (0-100)
- job_stability_score
- stress_level_estimate
- future_salary_estimate_USD

4. Learning Recommendations
Generate:
- skills_to_learn
- recommended_certifications
- tools_to_prepare

5. Framework / Tool Strength
Estimate knowledge level (0–100) for tools like:
Python
JavaScript
TensorFlow
React
AWS
Docker
SQL
Linux
Git

6. Skill Gap Detection
Return:
- missing_industry_skills
- recommended_projects
- recommended_practice_platforms (LeetCode, HackerRank, Kaggle etc.)

7. Generate Test Plan
Based on the skills detected create a short test plan for the student.

Example:
{
  "phase1": "Basic programming test",
  "phase2": "Intermediate problem solving",
  "phase3": "Project based assessment"
}

8. Dashboard Metrics
Calculate:
- career_prediction_score
- income_growth_prediction
- market_stability_score
- ai_confidence_score

Return response ONLY in this JSON format (no markdown, no code blocks, just pure JSON):

{
  "name": "string",
  "country": "string",
  "education": "string",
  "degree": "string",
  "university": "string",
  "graduation_year": number,
  "career_role": "string",
  "career_prediction_score": number (0-100),
  "career_match_score": number (0-100),
  "future_salary_estimate": number,
  "stress_level": "Low|Medium|High",
  "job_stability_score": number (0-100),
  "income_growth_prediction": number (0-100),
  "market_stability_score": number (0-100),
  "ai_confidence_score": number (0-100),
  "programming_languages": ["string"],
  "frameworks": ["string"],
  "tools": ["string"],
  "databases": ["string"],
  "cloud_platforms": ["string"],
  "soft_skills": ["string"],
  "top_5_strongest_skills": ["string"],
  "skill_proficiency_estimate": number (0-100),
  "skills_to_learn": ["string"],
  "recommended_certifications": ["string"],
  "tools_to_prepare": ["string"],
  "missing_industry_skills": ["string"],
  "recommended_projects": ["string"],
  "recommended_practice_platforms": ["string"],
  "framework_strength": {"tool_name": number},
  "test_plan": {"phase_name": "description"},
  "ai_insight": "string"
}

Resume Content:
""" + resume_text

    try:
        for attempt in range(MAX_RETRIES):
            try:
                model = genai.GenerativeModel(MODEL_NAME)
                response = model.generate_content(analysis_prompt)
                
                if not response or not response.text:
                    logger.error(f"Empty response from Gemini (attempt {attempt + 1}/{MAX_RETRIES})")
                    if attempt < MAX_RETRIES - 1:
                        continue
                    else:
                        raise ValueError("Gemini API returned empty response")
                
                response_text = response.text.strip()
                logger.info(f"Gemini response preview: {response_text[:200]}")
                
                # Remove markdown code blocks if present
                if response_text.startswith("```"):
                    response_text = response_text[response_text.find("{"):]
                    if response_text.endswith("```"):
                        response_text = response_text[:-3].strip()
                
                # Parse JSON
                data = json.loads(response_text)
                
                # Validate required fields
                required_fields = ["name", "country", "career_role", "career_prediction_score", 
                                 "future_salary_estimate", "stress_level", "job_stability_score",
                                 "programming_languages", "frameworks", "tools", "ai_insight",
                                 "skills_to_learn", "recommended_certifications"]
                
                missing = [f for f in required_fields if f not in data]
                if missing:
                    logger.warning(f"Missing fields in response: {missing}")
                
                return {
                    "status": "success",
                    "data": data,
                    "message": "Resume analysis completed successfully"
                }
                
            except json.JSONDecodeError as e:
                logger.warning(f"JSON parse error (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    continue
                else:
                    raise
            except ValueError as e:
                logger.error(f"Value error (attempt {attempt + 1}/{MAX_RETRIES}): {str(e)}")
                if attempt < MAX_RETRIES - 1:
                    continue
                else:
                    raise
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Resume analysis error: {error_msg}")
        return {
            "status": "error",
            "message": f"Failed to analyze resume: {error_msg}",
            "data": None
        }


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    try:
        import PyPDF2
        text = ""
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text()
        return text
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise ValueError(f"Could not read PDF: {str(e)}")


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    try:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise ValueError(f"Could not read DOCX: {str(e)}")


def extract_resume_text(file_path: str) -> str:
    """
    Extract text from resume file (supports .txt, .pdf, .docx).
    
    Args:
        file_path: Path to resume file
    
    Returns:
        Extracted resume text
    """
    try:
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if file_ext == ".txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        elif file_ext == ".pdf":
            return extract_text_from_pdf(file_path)
        elif file_ext in [".docx", ".doc"]:
            return extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
            
    except Exception as e:
        logger.error(f"Error extracting resume text: {e}")
        raise
