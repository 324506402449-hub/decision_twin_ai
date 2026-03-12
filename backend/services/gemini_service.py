"""
Gemini AI service – handles all Google Generative AI interactions.

Sends structured prompts to Gemini and parses JSON responses for
career options and simulation predictions. Falls back to realistic
per-career data when Gemini quota is exhausted.
"""

import asyncio
import json
import logging
import os
import re
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
BACKUP_MODEL = "gemini-1.5-flash"
MAX_RETRIES = 2
RETRY_DELAY = 5  # seconds
CAREER_DATABASE: dict[str, dict] = {
    "software engineer": {
        "base_salary": 92000, "growth_rate": 0.10, "stability": 80, "stress": "Medium",
    },
    "full-stack developer": {
        "base_salary": 90000, "growth_rate": 0.11, "stability": 79, "stress": "Medium",
    },
    "frontend developer": {
        "base_salary": 82000, "growth_rate": 0.09, "stability": 77, "stress": "Low",
    },
    "backend developer": {
        "base_salary": 90000, "growth_rate": 0.10, "stability": 80, "stress": "Medium",
    },
    "mobile app developer": {
        "base_salary": 88000, "growth_rate": 0.10, "stability": 78, "stress": "Medium",
    },
    "data scientist": {
        "base_salary": 95000, "growth_rate": 0.14, "stability": 88, "stress": "Medium",
    },
    "ai engineer": {
        "base_salary": 115000, "growth_rate": 0.16, "stability": 82, "stress": "Medium",
    },
    "machine learning engineer": {
        "base_salary": 110000, "growth_rate": 0.15, "stability": 85, "stress": "Medium",
    },
    "ai/ml engineer": {
        "base_salary": 112000, "growth_rate": 0.16, "stability": 83, "stress": "Medium",
    },
    "data analyst": {
        "base_salary": 68000, "growth_rate": 0.09, "stability": 90, "stress": "Low",
    },
    "deep learning engineer": {
        "base_salary": 120000, "growth_rate": 0.15, "stability": 75, "stress": "High",
    },
    "cloud engineer": {
        "base_salary": 105000, "growth_rate": 0.12, "stability": 84, "stress": "Medium",
    },
    "devops engineer": {
        "base_salary": 98000, "growth_rate": 0.11, "stability": 84, "stress": "Medium",
    },
    "site reliability engineer (sre)": {
        "base_salary": 118000, "growth_rate": 0.12, "stability": 86, "stress": "High",
    },
    "cybersecurity engineer": {
        "base_salary": 96000, "growth_rate": 0.13, "stability": 92, "stress": "High",
    },
    "ethical hacker / penetration tester": {
        "base_salary": 92000, "growth_rate": 0.14, "stability": 88, "stress": "High",
    },
    "embedded systems engineer": {
        "base_salary": 95000, "growth_rate": 0.08, "stability": 85, "stress": "Medium",
    },
    "vlsi engineer": {
        "base_salary": 100000, "growth_rate": 0.09, "stability": 87, "stress": "Medium",
    },
    "robotics engineer": {
        "base_salary": 105000, "growth_rate": 0.12, "stability": 78, "stress": "High",
    },
    "blockchain developer": {
        "base_salary": 108000, "growth_rate": 0.14, "stability": 68, "stress": "Medium",
    },
    "ar/vr engineer": {
        "base_salary": 110000, "growth_rate": 0.15, "stability": 70, "stress": "Medium",
    },
}

LOCATION_MULTIPLIERS: dict[str, float] = {
    "san francisco": 1.30, "new york": 1.22, "seattle": 1.18,
    "austin": 1.05, "bangalore": 0.40, "hyderabad": 0.38,
    "london": 1.12, "remote": 1.00,
}

EDUCATION_MULTIPLIERS: dict[str, float] = {
    "bachelor's degree": 1.00, "master's degree": 1.15,
    "phd": 1.30, "bootcamp": 0.88, "self taught": 0.82,
}

FALLBACK_CAREERS: list[str] = [
    "Software Engineer", "Full-Stack Developer", "Frontend Developer",
    "Backend Developer", "Mobile App Developer", "Data Scientist",
    "AI Engineer", "Machine Learning Engineer", "AI/ML Engineer",
    "Data Analyst", "Deep Learning Engineer", "Cloud Engineer",
    "DevOps Engineer", "Site Reliability Engineer (SRE)",
    "Cybersecurity Engineer", "Ethical Hacker / Penetration Tester",
    "Embedded Systems Engineer", "VLSI Engineer", "Robotics Engineer",
    "Blockchain Developer", "AR/VR Engineer",
]


def _build_fallback_career(
    career_name: str,
    education_level: str,
    location: str,
    risk_tolerance: float,
) -> dict:
    """Build realistic career prediction from local database."""
    key = career_name.strip().lower()
    info = CAREER_DATABASE.get(key, {
        "base_salary": 80000, "growth_rate": 0.10, "stability": 75, "stress": "Medium",
    })

    loc_mult = LOCATION_MULTIPLIERS.get(location.strip().lower(), 1.00)
    edu_mult = EDUCATION_MULTIPLIERS.get(education_level.strip().lower(), 1.00)

    base = info["base_salary"] * loc_mult * edu_mult
    growth = info["growth_rate"] * (1 + 0.25 * (risk_tolerance - 0.5))

    salary_growth = []
    current = base
    for _ in range(5):
        salary_growth.append(int(round(current / 1000) * 1000))
        current *= (1 + growth)

    stability = max(0, min(100, int(info["stability"] - 4 * (risk_tolerance - 0.5))))

    return {
        "name": career_name,
        "five_year_salary": salary_growth[-1],
        "stability": stability,
        "stress": info["stress"],
        "salary_growth": salary_growth,
    }


def _extract_json(text: str) -> dict | list:
    """Extract a JSON object or array from Gemini's response text."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = text.find(start_char)
        end = text.rfind(end_char)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                continue

    raise ValueError("Could not extract valid JSON from Gemini response")


async def _call_gemini(prompt: str) -> str:
    """Call Gemini with retry logic across models."""
    last_exc = None
    for model_name in [MODEL_NAME, BACKUP_MODEL]:
        for attempt in range(MAX_RETRIES):
            try:
                model = genai.GenerativeModel(model_name)
                response = await asyncio.to_thread(model.generate_content, prompt)
                return response.text
            except Exception as exc:
                last_exc = exc
                exc_str = str(exc)
                if "429" in exc_str or "quota" in exc_str.lower():
                    logger.warning("Gemini rate-limited (model=%s, attempt=%d): %s", model_name, attempt + 1, exc)
                    if attempt < MAX_RETRIES - 1:
                        await asyncio.sleep(RETRY_DELAY)
                    continue
                else:
                    logger.warning("Gemini error (model=%s): %s", model_name, exc)
                    break
    raise last_exc or RuntimeError("Gemini call failed")


async def fetch_career_options() -> list[str]:
    """Ask Gemini for the most in-demand tech careers."""
    prompt = (
        "List the top 11 most in-demand tech careers in AI, data science, "
        "and software engineering as of 2026. "
        "Return ONLY a valid JSON object with a single key 'careers' "
        "whose value is a JSON array of career title strings. "
        "No explanation, no markdown, just pure JSON. "
        "Example: {\"careers\": [\"Data Scientist\", \"ML Engineer\"]}"
    )

    try:
        text = await _call_gemini(prompt)
        data = _extract_json(text)
        if isinstance(data, dict) and "careers" in data:
            careers = data["careers"]
            if isinstance(careers, list) and len(careers) >= 3:
                return [str(c) for c in careers]
        if isinstance(data, list) and len(data) >= 3:
            return [str(c) for c in data]
    except Exception as exc:
        logger.warning("Gemini career-options failed, using fallback: %s", exc)

    return FALLBACK_CAREERS


async def fetch_simulation(
    career_a: str,
    career_b: str,
    education_level: str,
    location: str,
    risk_tolerance: float,
) -> dict:
    """Ask Gemini to compare two careers and return structured predictions."""
    prompt = (
        f"Compare these two tech careers: {career_a} vs {career_b}.\n"
        f"The candidate has a {education_level}, prefers working in {location}, "
        f"and has a risk tolerance of {risk_tolerance:.1f} (scale 0-1, where 1 is very aggressive).\n\n"
        "Based on current 2026 job market data, salary surveys, and industry trends, "
        "provide realistic salary predictions.\n\n"
        "Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:\n"
        "{\n"
        '  "career_a": {\n'
        f'    "name": "{career_a}",\n'
        '    "five_year_salary": <integer, predicted salary after 5 years in USD>,\n'
        '    "stability": <integer 0-100, job stability score>,\n'
        '    "stress": "<Low or Medium or High>",\n'
        '    "salary_growth": [<year1_salary>, <year2>, <year3>, <year4>, <year5>]\n'
        "  },\n"
        '  "career_b": {\n'
        f'    "name": "{career_b}",\n'
        '    "five_year_salary": <integer>,\n'
        '    "stability": <integer 0-100>,\n'
        '    "stress": "<Low or Medium or High>",\n'
        '    "salary_growth": [<y1>, <y2>, <y3>, <y4>, <y5>]\n'
        "  }\n"
        "}\n\n"
        "Rules:\n"
        "- salary_growth must have exactly 5 integers (year 1 through year 5).\n"
        "- five_year_salary must equal the last element of salary_growth.\n"
        "- stress must be exactly one of: Low, Medium, High.\n"
        "- All salary values must be realistic USD amounts based on 2026 market data.\n"
        f"- Factor in {location} cost-of-living and {education_level} impact on salary.\n"
        "- Each career MUST have DIFFERENT values — do NOT return identical numbers for both.\n"
        "- Return ONLY the JSON object, nothing else."
    )

    try:
        text = await _call_gemini(prompt)
        data = _extract_json(text)

        if isinstance(data, dict) and "career_a" in data and "career_b" in data:
            for key in ("career_a", "career_b"):
                c = data[key]
                c["five_year_salary"] = int(c["five_year_salary"])
                c["stability"] = max(0, min(100, int(c["stability"])))
                c["stress"] = c["stress"] if c["stress"] in ("Low", "Medium", "High") else "Medium"
                c["salary_growth"] = [int(s) for s in c["salary_growth"][:5]]
                while len(c["salary_growth"]) < 5:
                    c["salary_growth"].append(c["five_year_salary"])
                c["five_year_salary"] = c["salary_growth"][-1]
            logger.info("Gemini returned simulation data for %s vs %s", career_a, career_b)
            return data
    except Exception as exc:
        logger.warning("Gemini simulation failed, using smart fallback: %s", exc)
    logger.info("Using local career database for %s vs %s", career_a, career_b)
    return {
        "career_a": _build_fallback_career(career_a, education_level, location, risk_tolerance),
        "career_b": _build_fallback_career(career_b, education_level, location, risk_tolerance),
    }

DEMAND_CAREERS = [
    "Software Engineering",
    "Full-Stack Development",
    "Frontend Development",
    "Backend Development",
    "Mobile App Development",
    "Data Science",
    "AI Engineering",
    "Machine Learning Engineering",
    "AI/ML Engineering",
    "Data Analytics",
    "Deep Learning",
    "Cloud Engineering",
    "DevOps Engineering",
    "Site Reliability Engineering",
    "Cybersecurity",
    "Ethical Hacking / Penetration Testing",
    "Embedded Systems",
    "VLSI Engineering",
    "Robotics Engineering",
    "Blockchain Development",
    "AR/VR Engineering",
]


def _build_fallback_demand_trends() -> list[dict]:
    """Generate realistic 24-week demand data from local heuristics."""
    import random
    rng = random.Random(42)  # deterministic seed for consistency

    base_demands = {
        "Software Engineering": 78,
        "Full-Stack Development": 76,
        "Frontend Development": 70,
        "Backend Development": 73,
        "Mobile App Development": 68,
        "Data Science": 82,
        "AI Engineering": 80,
        "Machine Learning Engineering": 79,
        "AI/ML Engineering": 81,
        "Data Analytics": 68,
        "Deep Learning": 74,
        "Cloud Engineering": 72,
        "DevOps Engineering": 70,
        "Site Reliability Engineering": 66,
        "Cybersecurity": 75,
        "Ethical Hacking / Penetration Testing": 64,
        "Embedded Systems": 58,
        "VLSI Engineering": 55,
        "Robotics Engineering": 62,
        "Blockchain Development": 56,
        "AR/VR Engineering": 60,
    }
    drift = {
        "Software Engineering": 0.15,
        "Full-Stack Development": 0.18,
        "Frontend Development": 0.10,
        "Backend Development": 0.12,
        "Mobile App Development": 0.14,
        "Data Science": 0.35,
        "AI Engineering": 0.60,
        "Machine Learning Engineering": 0.55,
        "AI/ML Engineering": 0.58,
        "Data Analytics": 0.20,
        "Deep Learning": 0.50,
        "Cloud Engineering": 0.30,
        "DevOps Engineering": 0.25,
        "Site Reliability Engineering": 0.22,
        "Cybersecurity": 0.40,
        "Ethical Hacking / Penetration Testing": 0.35,
        "Embedded Systems": 0.15,
        "VLSI Engineering": 0.12,
        "Robotics Engineering": 0.28,
        "Blockchain Development": 0.20,
        "AR/VR Engineering": 0.30,
    }

    weeks = []
    current = dict(base_demands)
    for w in range(1, 25):
        careers = []
        for name in DEMAND_CAREERS:
            noise = rng.uniform(-1.5, 1.5)
            current[name] = max(30, min(100, current[name] + drift[name] + noise))
            careers.append({"name": name, "demand": round(current[name])})
        careers.sort(key=lambda c: c["demand"], reverse=True)
        weeks.append({"week": w, "careers": careers})
    return weeks


async def fetch_demand_trends() -> list[dict]:
    """Ask Gemini for 24-week career demand trends, fallback to local data."""
    prompt = (
        f"Generate a 24-week career demand forecast for these {len(DEMAND_CAREERS)} technology careers "
        "based on current 2026 job market trends:\n"
        + ", ".join(DEMAND_CAREERS)
        + "\n\n"
        "Return ONLY a valid JSON object (no markdown, no explanation) with this structure:\n"
        '{\n'
        '  "weeks": [\n'
        '    {\n'
        '      "week": 1,\n'
        '      "careers": [\n'
        '        {"name": "Data Science", "demand": 82},\n'
        '        {"name": "Machine Learning Engineering", "demand": 79}\n'
        '      ]\n'
        '    }\n'
        '  ]\n'
        '}\n\n'
        "Rules:\n"
        f"- Each week must have all {len(DEMAND_CAREERS)} careers with a demand integer 30-100.\n"
        "- Demand values should change week to week reflecting realistic trends.\n"
        "- AI/ML careers should trend upward, traditional roles grow slower.\n"
        "- careers array in each week sorted by demand descending.\n"
        "- Return all 24 weeks (week 1 through 24).\n"
        "- Return ONLY the JSON, nothing else."
    )

    try:
        text = await _call_gemini(prompt)
        data = _extract_json(text)
        if isinstance(data, dict) and "weeks" in data:
            weeks = data["weeks"]
            if isinstance(weeks, list) and len(weeks) >= 20:
                for w in weeks:
                    for c in w.get("careers", []):
                        c["demand"] = max(30, min(100, int(c["demand"])))
                logger.info("Gemini returned demand trends data (%d weeks)", len(weeks))
                return weeks
    except Exception as exc:
        logger.warning("Gemini demand-trends failed, using fallback: %s", exc)

    return _build_fallback_demand_trends()

_career_trends_cache: dict | None = None
_career_trends_cache_time: float = 0
CACHE_TTL = 6 * 3600  # 6 hours


def _build_fallback_career_trends() -> dict:
    """Generate realistic fallback data for the career trends dashboard."""
    import random
    rng = random.Random(99)

    careers = [
        "Data Science",
        "Machine Learning Engineering",
        "AI Engineering",
        "Software Engineering",
        "Cybersecurity",
    ]
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    weekly = []
    for d in days:
        row: dict = {"day": d}
        for c in careers:
            row[c] = rng.randint(35, 95)
        weekly.append(row)
    trend_lines: dict[str, list[int]] = {}
    bases = {"Data Science": 45, "Machine Learning Engineering": 40,
             "AI Engineering": 35, "Software Engineering": 50, "Cybersecurity": 30}
    for c in careers:
        vals = []
        v = bases[c]
        for _ in months:
            v = max(20, min(100, v + rng.randint(1, 8)))
            vals.append(v)
        trend_lines[c] = vals
    skills = [
        {"name": "Python", "percent": 89, "salary": 45328},
        {"name": "Machine Learning", "percent": 76, "salary": 37502},
        {"name": "Deep Learning", "percent": 60, "salary": 30010},
        {"name": "Cloud Computing", "percent": 51, "salary": 24893},
        {"name": "Data Visualization", "percent": 35, "salary": 17528},
    ]

    return {
        "weekly_career_demand": weekly,
        "career_trend_lines": trend_lines,
        "most_demanded_skills": skills,
    }


async def fetch_career_trends() -> dict:
    """Ask Gemini for career trends dashboard data with 6h caching."""
    import time
    global _career_trends_cache, _career_trends_cache_time

    now = time.time()
    if _career_trends_cache and (now - _career_trends_cache_time) < CACHE_TTL:
        return _career_trends_cache

    prompt = (
        "Generate technology career demand analytics for a dashboard.\n"
        "Return structured JSON containing:\n\n"
        "1. weekly_career_demand\n"
        "   An array of 7 objects (Mon through Sun). Each object has a 'day' key "
        "   and demand scores (integers 0–100) for these careers:\n"
        "   Data Science, Machine Learning Engineering, AI Engineering, "
        "   Software Engineering, Cybersecurity\n\n"
        "2. career_trend_lines\n"
        "   An object mapping each career name to an array of 12 monthly demand "
        "   scores (Jan through Dec, integers 0–100).\n\n"
        "3. most_demanded_skills\n"
        "   An array of exactly 5 objects with keys: name (skill name), percent "
        "   (demand percentage integer 0–100), salary (estimated average annual salary integer in USD).\n"
        "   Skills: Python, Machine Learning, Deep Learning, Cloud Computing, Data Visualization\n\n"
        "Return ONLY valid JSON. No markdown, no explanation.\n"
        "Example structure:\n"
        '{\n'
        '  "weekly_career_demand": [{"day":"Mon","Data Science":45,"Machine Learning Engineering":40,"AI Engineering":38,"Software Engineering":42,"Cybersecurity":36}],\n'
        '  "career_trend_lines": {"Data Science":[45,50,60,70,85,90,92,95,88,84,80,78]},\n'
        '  "most_demanded_skills": [{"name":"Python","percent":89,"salary":45328}]\n'
        '}'
    )

    try:
        text = await _call_gemini(prompt)
        data = _extract_json(text)
        if isinstance(data, dict):
            has_weekly = isinstance(data.get("weekly_career_demand"), list)
            has_trends = isinstance(data.get("career_trend_lines"), dict)
            has_skills = isinstance(data.get("most_demanded_skills"), list)
            if has_weekly and has_trends and has_skills:
                for day_obj in data["weekly_career_demand"]:
                    for k, v in day_obj.items():
                        if k != "day" and isinstance(v, (int, float)):
                            day_obj[k] = max(0, min(100, int(v)))
                for career, vals in data["career_trend_lines"].items():
                    data["career_trend_lines"][career] = [
                        max(0, min(100, int(v))) for v in vals
                    ]
                for skill in data["most_demanded_skills"]:
                    skill["percent"] = max(0, min(100, int(skill["percent"])))
                    skill["salary"] = int(skill["salary"])

                logger.info("Gemini returned career-trends dashboard data")
                _career_trends_cache = data
                _career_trends_cache_time = now
                return data
    except Exception as exc:
        logger.warning("Gemini career-trends failed, using fallback: %s", exc)

    fallback = _build_fallback_career_trends()
    _career_trends_cache = fallback
    _career_trends_cache_time = now
    return fallback

ROADMAP_SKILLS: dict[str, list[str]] = {
    "software engineering": [
        "Programming Fundamentals", "Data Structures & Algorithms",
        "System Design", "Databases", "DevOps Basics",
    ],
    "full-stack development": [
        "Frontend Development", "Backend Development",
        "Databases", "APIs & Web Services", "DevOps Basics",
    ],
    "frontend development": [
        "HTML/CSS/JavaScript", "React & Component Design",
        "State Management", "Testing & QA", "Performance & Accessibility",
    ],
    "backend development": [
        "Programming Fundamentals", "APIs & Web Services",
        "Databases", "System Design", "DevOps Basics",
    ],
    "mobile app development": [
        "Mobile UI/UX", "React Native / Flutter",
        "APIs & Web Services", "App Store & Deployment", "Testing & QA",
    ],
    "data science": [
        "Python Programming", "Statistics & Probability",
        "Machine Learning", "Data Visualization", "SQL & Databases",
    ],
    "ai engineering": [
        "Python Programming", "Machine Learning",
        "Deep Learning", "Natural Language Processing", "Computer Vision",
    ],
    "machine learning engineering": [
        "Python Programming", "Machine Learning Algorithms",
        "Deep Learning & Neural Networks", "ML System Design", "Cloud ML Services",
    ],
    "ai/ml engineering": [
        "Python Programming", "Machine Learning",
        "Deep Learning", "Natural Language Processing", "ML System Design",
    ],
    "data analytics": [
        "SQL & Databases", "Python Programming",
        "Data Visualization", "Statistics & Probability", "Business Intelligence",
    ],
    "deep learning": [
        "Python Programming", "Deep Learning & Neural Networks",
        "Natural Language Processing", "Computer Vision", "ML System Design",
    ],
    "cloud engineering": [
        "Networking Fundamentals", "Cloud Platforms (AWS/Azure/GCP)",
        "Containers & Kubernetes", "Infrastructure as Code", "Security & IAM",
    ],
    "devops engineering": [
        "Linux & Scripting", "CI/CD Pipelines",
        "Containers & Kubernetes", "Cloud Platforms (AWS/Azure/GCP)", "Monitoring & Logging",
    ],
    "site reliability engineering": [
        "Linux & Scripting", "System Design",
        "Monitoring & Logging", "Incident Response", "Cloud Platforms (AWS/Azure/GCP)",
    ],
    "cybersecurity": [
        "Networking Fundamentals", "Security Principles",
        "Ethical Hacking", "Cryptography", "Incident Response",
    ],
    "ethical hacking / penetration testing": [
        "Networking Fundamentals", "Security Principles",
        "Ethical Hacking", "Web App Security", "Reporting & Documentation",
    ],
    "embedded systems": [
        "C/C++ Programming", "Microcontrollers & Hardware",
        "RTOS Concepts", "Communication Protocols", "Testing & Debugging",
    ],
    "vlsi engineering": [
        "Digital Logic Design", "Verilog/VHDL",
        "ASIC Design Flow", "FPGA Prototyping", "Verification & Testing",
    ],
    "robotics engineering": [
        "Python Programming", "ROS & Simulation",
        "Computer Vision", "Control Systems", "Sensors & Actuators",
    ],
    "blockchain development": [
        "Blockchain Fundamentals", "Solidity & Smart Contracts",
        "DApp Development", "Security & Auditing", "Web3 & Token Standards",
    ],
    "ar/vr engineering": [
        "3D Math & Graphics", "Unity / Unreal Engine",
        "Spatial Computing", "XR Interaction Design", "Performance & Optimization",
    ],
}

SKILL_SUBTOPICS: dict[str, list[str]] = {
    "Python Programming": ["Variables & Data Types", "Functions & OOP", "Libraries (NumPy, Pandas)"],
    "Statistics & Probability": ["Descriptive Statistics", "Hypothesis Testing", "Probability Distributions"],
    "Machine Learning": ["Regression & Classification", "Clustering & Ensembles", "Model Evaluation"],
    "Machine Learning Algorithms": ["Regression & Classification", "Clustering & Ensembles", "Model Evaluation"],
    "Deep Learning": ["Neural Networks & CNNs", "RNNs & Transformers", "Transfer Learning"],
    "Deep Learning & Neural Networks": ["Neural Networks & CNNs", "RNNs & Transformers", "Transfer Learning"],
    "Data Structures & Algorithms": ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming"],
    "System Design": ["Scalability & Caching", "Load Balancing", "Microservices"],
    "Natural Language Processing": ["Text Preprocessing", "Embeddings & Sequence Models", "Transformers & LLMs"],
    "Computer Vision": ["Image Processing", "Object Detection", "Image Segmentation"],
    "Cloud Platforms (AWS/Azure/GCP)": ["Compute & Storage", "Networking & Serverless", "IAM & Security"],
    "Networking Fundamentals": ["OSI Model & TCP/IP", "DNS & HTTP", "Firewalls & VPNs"],
    "Programming Fundamentals": ["Variables & Control Flow", "Functions & OOP", "Error Handling"],
    "Data Visualization": ["Matplotlib & Seaborn", "Plotly & Dashboards", "Storytelling with Data"],
    "SQL & Databases": ["SQL Queries & Joins", "Database Design", "NoSQL Basics"],
    "Databases": ["SQL Fundamentals", "NoSQL Databases", "Indexing & Performance"],
    "Security Principles": ["CIA Triad", "Auth & Access Control", "OWASP Top 10"],
    "Ethical Hacking": ["Reconnaissance", "Vulnerability Scanning", "Penetration Testing"],
    "APIs & Web Services": ["REST & GraphQL", "Authentication (JWT, OAuth)", "API Design Patterns"],
    "DevOps Basics": ["Git & Version Control", "CI/CD Basics", "Docker Fundamentals"],
    "Testing & QA": ["Unit Testing", "Integration Testing", "Test Automation"],
    "HTML/CSS/JavaScript": ["HTML Semantics", "CSS Flexbox & Grid", "ES6+ JavaScript"],
    "React & Component Design": ["JSX & Props", "Hooks & State", "Component Patterns"],
    "State Management": ["Context API", "Redux / Zustand", "Server State (React Query)"],
    "Performance & Accessibility": ["Core Web Vitals", "Lazy Loading", "ARIA & Screen Readers"],
    "Mobile UI/UX": ["Mobile Design Patterns", "Responsive Layouts", "Gesture Handling"],
    "React Native / Flutter": ["Project Setup", "Navigation & Routing", "Platform APIs"],
    "App Store & Deployment": ["Build & Signing", "Store Guidelines", "OTA Updates"],
    "Frontend Development": ["HTML/CSS/JS", "React Framework", "Build Tools (Vite, Webpack)"],
    "Backend Development": ["Node.js / Python", "REST APIs", "Database Integration"],
    "ML System Design": ["Feature Stores", "Model Serving", "A/B Testing"],
    "Cloud ML Services": ["SageMaker / Vertex AI", "Model Deployment", "Auto Scaling"],
    "Business Intelligence": ["BI Tools (Tableau, Power BI)", "KPI Dashboards", "Data Storytelling"],
    "CI/CD Pipelines": ["GitHub Actions", "Jenkins / GitLab CI", "Deployment Strategies"],
    "Containers & Kubernetes": ["Docker Deep Dive", "Kubernetes Basics", "Helm & Operators"],
    "Infrastructure as Code": ["Terraform", "CloudFormation", "Ansible"],
    "Monitoring & Logging": ["Prometheus & Grafana", "ELK Stack", "Alerting & On-call"],
    "Linux & Scripting": ["Linux Commands", "Bash Scripting", "System Administration"],
    "Incident Response": ["Incident Triage", "Root Cause Analysis", "Post-mortems"],
    "Security & IAM": ["Identity Management", "Key Management", "Compliance"],
    "Cryptography": ["Symmetric & Asymmetric", "Hashing & Signatures", "TLS & PKI"],
    "Web App Security": ["XSS & CSRF", "SQL Injection", "Security Headers"],
    "Reporting & Documentation": ["Vulnerability Reports", "Risk Assessment", "Remediation Plans"],
    "C/C++ Programming": ["Pointers & Memory", "Data Structures in C", "Embedded C"],
    "Microcontrollers & Hardware": ["ARM Architecture", "GPIO & Peripherals", "Circuit Basics"],
    "RTOS Concepts": ["Tasks & Scheduling", "Semaphores & Mutexes", "Memory Management"],
    "Communication Protocols": ["I2C / SPI / UART", "CAN Bus", "Wireless (BLE, WiFi)"],
    "Testing & Debugging": ["JTAG & Logic Analyzers", "Unit Testing (Embedded)", "Debugging Techniques"],
    "Digital Logic Design": ["Boolean Algebra", "Combinational Circuits", "Sequential Circuits"],
    "Verilog/VHDL": ["Syntax & Modules", "Testbenches", "Synthesis"],
    "ASIC Design Flow": ["RTL Design", "Synthesis & P&R", "Timing Closure"],
    "FPGA Prototyping": ["FPGA Architecture", "Implementation Flow", "Debugging on FPGA"],
    "Verification & Testing": ["Simulation", "Formal Verification", "Coverage Metrics"],
    "ROS & Simulation": ["ROS2 Basics", "Gazebo Simulation", "TF & URDF"],
    "Control Systems": ["PID Control", "State Space", "Motion Planning"],
    "Sensors & Actuators": ["LIDAR & Camera", "Motor Control", "Sensor Fusion"],
    "Blockchain Fundamentals": ["Distributed Ledgers", "Consensus Mechanisms", "Cryptographic Hashing"],
    "Solidity & Smart Contracts": ["Solidity Syntax", "ERC Standards", "Testing & Deployment"],
    "DApp Development": ["Ethers.js / Web3.js", "Frontend Integration", "IPFS Storage"],
    "Security & Auditing": ["Common Vulnerabilities", "Audit Tools", "Best Practices"],
    "Web3 & Token Standards": ["ERC-20 / ERC-721", "DeFi Protocols", "DAO Governance"],
    "3D Math & Graphics": ["Linear Algebra for 3D", "Shaders & Rendering", "Physics Engines"],
    "Unity / Unreal Engine": ["Engine Basics", "Scripting (C# / Blueprints)", "Asset Pipeline"],
    "Spatial Computing": ["AR Foundations", "Hand & Eye Tracking", "Spatial Anchors"],
    "XR Interaction Design": ["UX for XR", "Locomotion Systems", "Haptic Feedback"],
    "Performance & Optimization": ["Frame Rate Optimization", "LOD & Culling", "Memory Profiling"],
}


def _build_fallback_roadmap(
    primary_career: str,
    secondary_career: str,
    third_career: str,
    focus_mode: str,
    start_date: str,
    end_date: str,
    schedule_style: str,
) -> dict:
    """Build a structured roadmap from local skill data."""
    from datetime import datetime, timedelta

    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    total_days = max(1, (end - start).days)

    careers_to_map: list[str] = [primary_career]
    if focus_mode in ("two_alternating", "three_simultaneous") and secondary_career:
        careers_to_map.append(secondary_career)
    if focus_mode == "three_simultaneous" and third_career:
        careers_to_map.append(third_career)
    mindmap: dict[str, list[str]] = {}
    for career in careers_to_map:
        key = career.strip().lower()
        skills = ROADMAP_SKILLS.get(key, [
            "Core Fundamentals", "Tools & Technologies",
            "Intermediate Concepts", "Advanced Topics",
            "Projects & Portfolio",
        ])
        mindmap[career] = skills
        for skill in skills:
            if skill in SKILL_SUBTOPICS:
                mindmap[skill] = SKILL_SUBTOPICS[skill]
    all_topics: list[str] = []
    for career in careers_to_map:
        key = career.strip().lower()
        skills = ROADMAP_SKILLS.get(key, ["Core Fundamentals", "Tools & Technologies", "Advanced Topics"])
        for skill in skills:
            subtopics = SKILL_SUBTOPICS.get(skill, [skill])
            all_topics.extend(subtopics)

    if not all_topics:
        all_topics = ["Study & Practice"]

    hours_map = {"morning": "2", "evening": "2", "full_day": "4"}
    hours = hours_map.get(schedule_style, "3")

    schedule_days = min(total_days, 90)  # cap at 90 days
    schedule: list[dict] = []
    for day_idx in range(schedule_days):
        topic = all_topics[day_idx % len(all_topics)]
        schedule.append({
            "day": f"Day {day_idx + 1}",
            "date": (start + timedelta(days=day_idx)).strftime("%Y-%m-%d"),
            "topic": topic,
            "hours": hours,
        })

    return {"mindmap": mindmap, "schedule": schedule}


def _pad_schedule(
    existing: list[dict],
    target_days: int,
    start_date: str,
    mindmap: dict,
    careers: list[str],
    time_desc: str,
) -> list[dict]:
    """Pad the schedule if Gemini returned fewer entries than needed."""
    from datetime import datetime, timedelta
    all_topics: list[str] = []
    for career in careers:
        if career and career in mindmap:
            skills = mindmap[career]
            if isinstance(skills, list):
                for skill in skills:
                    subs = mindmap.get(skill, [])
                    if isinstance(subs, list) and subs:
                        all_topics.extend(subs)
                    else:
                        all_topics.append(skill)
    if not all_topics:
        all_topics = ["Study & Practice"]

    hours = "2"
    if "4" in time_desc:
        hours = "4"

    start = datetime.strptime(start_date, "%Y-%m-%d")
    schedule = list(existing)  # copy

    for day_idx in range(len(schedule), target_days):
        topic = all_topics[day_idx % len(all_topics)]
        schedule.append({
            "day": f"Day {day_idx + 1}",
            "date": (start + timedelta(days=day_idx)).strftime("%Y-%m-%d"),
            "topic": topic,
            "hours": hours,
        })

    return schedule


async def fetch_career_roadmap(
    primary_career: str,
    secondary_career: str,
    third_career: str,
    focus_mode: str,
    start_date: str,
    end_date: str,
    schedule_style: str,
) -> dict:
    """Ask Gemini for a career learning roadmap with mind map and schedule."""

    careers_desc = primary_career
    if focus_mode in ("two_alternating", "three_simultaneous") and secondary_career:
        careers_desc += f" and {secondary_career}"
    if focus_mode == "three_simultaneous" and third_career:
        careers_desc += f" and {third_career}"

    focus_desc = {
        "one_focus": "Focus deeply on the primary career path",
        "two_alternating": "Alternate learning between two career paths",
        "three_simultaneous": "Explore all three careers simultaneously",
    }.get(focus_mode, "Focus on primary career")

    time_desc = {
        "morning": "morning sessions (2 hours/day)",
        "evening": "evening sessions (2 hours/day)",
        "full_day": "full day sessions (4 hours/day)",
    }.get(schedule_style, "flexible sessions (3 hours/day)")
    from datetime import datetime as _dt
    _start = _dt.strptime(start_date, "%Y-%m-%d")
    _end = _dt.strptime(end_date, "%Y-%m-%d")
    total_days = max(1, (_end - _start).days)
    schedule_days = min(total_days, 90)  # cap at 90

    prompt = (
        f"Generate a learning roadmap for: {careers_desc}.\n"
        f"Learning strategy: {focus_desc}.\n"
        f"Schedule: {time_desc} from {start_date} to {end_date} ({total_days} days total).\n\n"
        "Return ONLY a valid JSON object with this exact structure:\n"
        "{\n"
        '  "mindmap": {\n'
        f'    "{primary_career}": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5"],\n'
        '    "Skill1": ["Subtopic A", "Subtopic B", "Subtopic C"]\n'
        "  },\n"
        '  "schedule": [\n'
        '    {"day": "Day 1", "date": "' + start_date + '", "topic": "Topic Name", "hours": "2"},\n'
        '    {"day": "Day 2", "date": "...", "topic": "...", "hours": "2"}\n'
        "  ]\n"
        "}\n\n"
        "STRICT RULES:\n"
        "- mindmap: each career gets EXACTLY 5 main skills (no more, no less).\n"
        "- Each skill gets EXACTLY 3 subtopics (no more, no less).\n"
        "- The mindmap must have only 3 levels: career -> skills -> subtopics. No deeper nesting.\n"
        f"- schedule: generate EXACTLY {schedule_days} entries, one per day, starting from {start_date}.\n"
        "- Each schedule entry must have day, date, topic, and hours fields.\n"
        f"- hours per day: {time_desc.split('(')[1].split(')')[0] if '(' in time_desc else '2 hours/day'}.\n"
        "- Dates must increment by one day from the start date.\n"
        "- Return ONLY valid JSON. No markdown fences, no explanation text."
    )

    try:
        text = await _call_gemini(prompt)
        data = _extract_json(text)
        if isinstance(data, dict) and "mindmap" in data and "schedule" in data:
            mindmap = data["mindmap"]
            schedule = data["schedule"]
            if isinstance(mindmap, dict) and isinstance(schedule, list):
                for career_key in list(mindmap.keys()):
                    if isinstance(mindmap[career_key], list):
                        mindmap[career_key] = mindmap[career_key][:5]
                for skill_key in list(mindmap.keys()):
                    if isinstance(mindmap[skill_key], list) and skill_key not in [primary_career, secondary_career, third_career]:
                        mindmap[skill_key] = mindmap[skill_key][:3]
                for entry in schedule:
                    entry["day"] = str(entry.get("day", ""))
                    entry["topic"] = str(entry.get("topic", ""))
                    entry["hours"] = str(entry.get("hours", "2"))
                    entry["date"] = str(entry.get("date", ""))
                if len(schedule) < schedule_days:
                    schedule = _pad_schedule(
                        schedule, schedule_days, start_date, mindmap,
                        [primary_career, secondary_career, third_career],
                        time_desc,
                    )
                    data["schedule"] = schedule

                logger.info("Gemini returned career roadmap for %s (%d schedule days)", careers_desc, len(schedule))
                return data
    except Exception as exc:
        logger.warning("Gemini roadmap generation failed, using fallback: %s", exc)

    return _build_fallback_roadmap(
        primary_career, secondary_career, third_career,
        focus_mode, start_date, end_date, schedule_style,
    )

_demanding_skills_cache: dict | None = None
_demanding_skills_cache_time: float = 0
SKILLS_CACHE_TTL = 3 * 3600  # 3 hours


def _build_fallback_demanding_skills() -> dict:
    """Realistic fallback for demanding skills predictions."""
    return {
        "full_time_skills": [
            {"name": "Generative AI & LLM Engineering", "demand_score": 96, "avg_salary": 165000, "growth": "+42%", "category": "AI"},
            {"name": "Cloud Architecture (AWS/Azure/GCP)", "demand_score": 91, "avg_salary": 155000, "growth": "+28%", "category": "Cloud"},
            {"name": "MLOps & ML System Design", "demand_score": 88, "avg_salary": 148000, "growth": "+35%", "category": "ML"},
            {"name": "Cybersecurity Engineering", "demand_score": 87, "avg_salary": 142000, "growth": "+25%", "category": "Security"},
            {"name": "Full-Stack Development (React + Node)", "demand_score": 84, "avg_salary": 130000, "growth": "+18%", "category": "Dev"},
            {"name": "Data Engineering (Spark, Kafka)", "demand_score": 83, "avg_salary": 140000, "growth": "+22%", "category": "Data"},
        ],
        "part_time_skills": [
            {"name": "Prompt Engineering", "demand_score": 93, "avg_hourly": 75, "growth": "+55%", "category": "AI"},
            {"name": "Freelance Web Development", "demand_score": 82, "avg_hourly": 60, "growth": "+15%", "category": "Dev"},
            {"name": "Data Annotation & Labeling", "demand_score": 79, "avg_hourly": 35, "growth": "+30%", "category": "Data"},
            {"name": "Technical Writing", "demand_score": 76, "avg_hourly": 50, "growth": "+12%", "category": "Content"},
            {"name": "UI/UX Design (Figma)", "demand_score": 74, "avg_hourly": 55, "growth": "+20%", "category": "Design"},
            {"name": "API Integration Consulting", "demand_score": 72, "avg_hourly": 65, "growth": "+18%", "category": "Dev"},
        ],
        "prediction_summary": "AI and cloud skills dominate 2026 demand. Generative AI roles see the fastest growth, while prompt engineering leads part-time/freelance opportunities.",
    }


async def fetch_demanding_skills() -> dict:
    """Ask Gemini for current most-demanding skills (full-time & part-time)."""
    import time
    global _demanding_skills_cache, _demanding_skills_cache_time

    now = time.time()
    if _demanding_skills_cache and (now - _demanding_skills_cache_time) < SKILLS_CACHE_TTL:
        return _demanding_skills_cache

    prompt = (
        "Based on the 2026 job market, predict the most in-demand technology skills.\n\n"
        "Return ONLY a valid JSON object (no markdown, no explanation) with this structure:\n"
        "{\n"
        '  "full_time_skills": [\n'
        '    {"name": "Skill Name", "demand_score": 95, "avg_salary": 150000, "growth": "+30%", "category": "AI"}\n'
        "  ],\n"
        '  "part_time_skills": [\n'
        '    {"name": "Skill Name", "demand_score": 90, "avg_hourly": 70, "growth": "+25%", "category": "Dev"}\n'
        "  ],\n"
        '  "prediction_summary": "Brief 1-2 sentence summary of skill demand trends"\n'
        "}\n\n"
        "Rules:\n"
        "- full_time_skills: exactly 6 skills, sorted by demand_score descending.\n"
        "- part_time_skills: exactly 6 freelance/part-time skills, sorted by demand_score descending.\n"
        "- demand_score: integer 50-100.\n"
        "- avg_salary: integer USD annual for full-time.\n"
        "- avg_hourly: integer USD hourly rate for part-time.\n"
        "- growth: percentage string like '+30%'.\n"
        "- category: short label (AI, ML, Cloud, Dev, Data, Security, Design, Content).\n"
        "- Include cutting-edge 2026 skills like GenAI, LLM engineering, prompt engineering.\n"
        "- Return ONLY valid JSON."
    )

    try:
        text = await _call_gemini(prompt)
        data = _extract_json(text)
        if isinstance(data, dict):
            has_ft = isinstance(data.get("full_time_skills"), list)
            has_pt = isinstance(data.get("part_time_skills"), list)
            if has_ft and has_pt:
                for skill in data["full_time_skills"]:
                    skill["demand_score"] = max(0, min(100, int(skill.get("demand_score", 50))))
                    skill["avg_salary"] = int(skill.get("avg_salary", 80000))
                for skill in data["part_time_skills"]:
                    skill["demand_score"] = max(0, min(100, int(skill.get("demand_score", 50))))
                    skill["avg_hourly"] = int(skill.get("avg_hourly", 40))
                logger.info("Gemini returned demanding skills data")
                _demanding_skills_cache = data
                _demanding_skills_cache_time = now
                return data
    except Exception as exc:
        logger.warning("Gemini demanding-skills failed, using fallback: %s", exc)

    fallback = _build_fallback_demanding_skills()
    _demanding_skills_cache = fallback
    _demanding_skills_cache_time = now
    return fallback
