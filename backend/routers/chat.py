"""Chat router – AI chatbot endpoint powered by Gemini (new google-genai SDK)."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)
_chat_api_key = os.getenv("GEMINI_CHAT_API_KEY", "")
if not _chat_api_key:
    logger.warning("GEMINI_CHAT_API_KEY not set – chatbot will use fallback responses")
_use_new_sdk = False
_client = None

if _chat_api_key:
    try:
        from google import genai as new_genai
        _client = new_genai.Client(api_key=_chat_api_key)
        _use_new_sdk = True
        logger.info("Chatbot: using google-genai SDK with dedicated key")
    except ImportError:
        logger.info("google-genai SDK not found, trying legacy SDK")

    if not _use_new_sdk:
        try:
            import google.generativeai as old_genai
            old_genai.configure(api_key=_chat_api_key)
        except ImportError:
            logger.error("No Gemini SDK available for chatbot")

router = APIRouter()

CHAT_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-flash-latest",
]

SYSTEM_PROMPT = (
    "You are Decision Twin AI, an intelligent assistant that helps users with "
    "career simulations, AI learning phases, internships, project recommendations, "
    "and data-driven decisions.\n\n"
    "You are embedded in a career decision simulator dashboard. Your capabilities include:\n"
    "- Analyzing simulation results and career comparisons\n"
    "- Suggesting AI/ML learning phases and roadmaps\n"
    "- Recommending projects for portfolio building\n"
    "- Finding internship opportunities and strategies\n"
    "- Guiding career paths in tech, AI, data science, and related fields\n"
    "- Providing data-driven insights for career decisions\n\n"
    "Be concise, professional, and actionable in your responses. "
    "Use bullet points and structured formatting when helpful. "
    "Always be encouraging and supportive while being realistic about career outcomes."
)
FALLBACK_RESPONSES = {
    "default": (
        "I'm currently experiencing high demand and my AI engine is rate-limited. "
        "Here are some things I can help with once I'm back:\n\n"
        "• **Career Simulations** – Compare two career paths side by side\n"
        "• **AI Learning Roadmap** – Get a step-by-step plan to learn AI/ML\n"
        "• **Project Suggestions** – Portfolio projects for your target role\n"
        "• **Internship Strategy** – Tips to land AI/ML internships\n\n"
        "Please try again in a minute, or use the Simulator tab to run a full career comparison!"
    ),
    "project": (
        "Here are top AI/ML project ideas for your portfolio:\n\n"
        "1. **Sentiment Analysis Dashboard** – NLP + React visualization\n"
        "2. **Resume Screening Bot** – ML classifier for job applications\n"
        "3. **Stock Price Predictor** – LSTM/Transformer time-series model\n"
        "4. **AI Chatbot** – Fine-tune an LLM for a specific domain\n"
        "5. **Image Classifier** – CNN with transfer learning (ResNet/EfficientNet)\n\n"
        "💡 Tip: Deploy each project and add a live demo link to your portfolio!"
    ),
    "internship": (
        "Here are strategies to land AI/ML internships:\n\n"
        "1. **Build a portfolio** with 3-5 strong ML/AI projects on GitHub\n"
        "2. **Apply early** – top internships open 6+ months in advance\n"
        "3. **Target these companies**: Google, Microsoft, Meta, Amazon, NVIDIA, OpenAI\n"
        "4. **Practice LeetCode** (medium level) + ML system design\n"
        "5. **Network on LinkedIn** – connect with recruiters and AI team leads\n\n"
        "📌 Key: Tailor your resume for each role with relevant keywords!"
    ),
    "roadmap": (
        "Here's a comprehensive AI/ML learning roadmap:\n\n"
        "**Phase 1 (Months 1-2):** Python, NumPy, Pandas, basic statistics\n"
        "**Phase 2 (Months 3-4):** Scikit-learn, supervised/unsupervised learning\n"
        "**Phase 3 (Months 5-6):** Deep Learning with PyTorch/TensorFlow\n"
        "**Phase 4 (Months 7-8):** NLP, Computer Vision, Transformers\n"
        "**Phase 5 (Months 9-12):** MLOps, deployment, portfolio projects\n\n"
        "🎯 Focus on one phase at a time and build a project after each phase!"
    ),
    "simulation": (
        "To analyze your simulation results, head to the **Simulator** tab where you can:\n\n"
        "• Compare two career paths side-by-side\n"
        "• See 5-year salary growth projections\n"
        "• Compare stability, stress, and growth metrics\n"
        "• Save scenarios for later review\n\n"
        "Run a simulation first, then come back and I'll help you interpret the results!"
    ),
    "hello": (
        "Hello! 👋 I'm your Decision Twin AI assistant. I can help you with:\n\n"
        "• **Career Comparisons** – Which path suits you best?\n"
        "• **AI Learning Roadmap** – Step-by-step plan to master AI/ML\n"
        "• **Project Ideas** – Build an impressive portfolio\n"
        "• **Internship Strategy** – Land your dream internship\n"
        "• **Simulation Analysis** – Understand your career predictions\n\n"
        "What would you like to explore? Try one of the quick suggestions below!"
    ),
}


def _pick_fallback(message: str) -> str:
    """Select the best fallback response based on keywords in the user message."""
    msg_lower = message.lower()
    words = set(msg_lower.split())
    if any(w in msg_lower for w in ("project", "portfolio", "build")):
        return FALLBACK_RESPONSES["project"]
    if any(w in msg_lower for w in ("intern", "job", "apply", "company")):
        return FALLBACK_RESPONSES["internship"]
    if any(w in msg_lower for w in ("roadmap", "learn", "phase", "study", "course")):
        return FALLBACK_RESPONSES["roadmap"]
    if any(w in msg_lower for w in ("simulat", "analyz", "result", "compare", "career")):
        return FALLBACK_RESPONSES["simulation"]
    if words & {"hello", "hi", "hey", "help"} or "what can" in msg_lower:
        return FALLBACK_RESPONSES["hello"]
    return FALLBACK_RESPONSES["default"]


def _call_gemini_new_sdk(user_msg: str) -> str | None:
    """Try generating a response using the new google-genai SDK."""
    if not _client:
        return None
    for model_name in CHAT_MODELS:
        try:
            full_prompt = f"{SYSTEM_PROMPT}\n\nUser question: {user_msg}"
            response = _client.models.generate_content(
                model=model_name,
                contents=full_prompt,
            )
            if response and response.text:
                return response.text
        except Exception as exc:
            logger.warning("New SDK model %s failed: %s", model_name, str(exc)[:200])
            continue
    return None


def _call_gemini_old_sdk(user_msg: str) -> str | None:
    """Try generating a response using the legacy google-generativeai SDK."""
    try:
        import google.generativeai as old_genai
    except ImportError:
        return None

    for model_name in CHAT_MODELS:
        try:
            model = old_genai.GenerativeModel(model_name)
            chat_session = model.start_chat(
                history=[
                    {"role": "user", "parts": ["Who are you and what can you do?"]},
                    {"role": "model", "parts": [SYSTEM_PROMPT]},
                ],
            )
            result = chat_session.send_message(user_msg)
            if result and result.text:
                return result.text
        except Exception as exc:
            logger.warning("Old SDK model %s failed: %s", model_name, str(exc)[:200])
            continue
    return None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)


class ChatResponse(BaseModel):
    reply: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """Send a user message to Gemini and return the AI response."""
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message is required.")
    if _use_new_sdk:
        result = _call_gemini_new_sdk(user_msg)
        if result:
            return ChatResponse(reply=result)
    result = _call_gemini_old_sdk(user_msg)
    if result:
        return ChatResponse(reply=result)
    logger.info("All Gemini models unavailable, returning smart fallback")
    return ChatResponse(reply=_pick_fallback(user_msg))
