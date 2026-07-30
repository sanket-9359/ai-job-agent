"""
AI Service — FastAPI app
Fixed version: Added retry logic to prevent incomplete/thin bullet points.
"""

import os
import logging
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, List, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from llm_generator import generate_cold_email, generate_resume_bullets

load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO"), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Startup ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AI Service starting up")
    if not os.getenv("GROQ_API_KEY"):
        logger.warning("⚠️  GROQ_API_KEY not set — AI responses will use fallbacks")
    yield
    logger.info("👋 AI Service shutting down")


app = FastAPI(title="AI Job Agent Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class JobData(BaseModel):
    title: Optional[str] = "Job Title"
    company: Optional[str] = "Company"
    description: Optional[str] = ""
    location: Optional[str] = None
    skills: Optional[List[str]] = None
    requiredExperience: Optional[Any] = None
    jobType: Optional[str] = None
    workMode: Optional[str] = None

class ProfileData(BaseModel):
    targetRole: Optional[str] = ""
    experience: Optional[Any] = "0"
    skills: Optional[List[str]] = []
    # Support both camelCase and snake_case
    resumeText: Optional[str] = Field(default=None, alias="resume_text")

    class Config:
        populate_by_name = True


class AIRequest(BaseModel):
    job: JobData
    profile: ProfileData


# ── Fallback builders ─────────────────────────────────────────────────────────
def _fallback_email(job: JobData, profile: ProfileData) -> dict:
    skills = profile.skills or []
    top = ", ".join(skills[:3]) or "software development"
    company = job.company or "your company"
    position = job.title or profile.targetRole or "the role"
    exp = str(profile.experience) or "0"

    experience_msg = f"I have experience in the industry."
    if exp == "0" or "fresher" in exp.lower():
        experience_msg = f"I am a motivated fresher looking for my first opportunity at {company}."

    subject = f"Application for {position} – {skills[0] if skills else 'Experienced'} Developer"
    body = (
        f"Dear {company} Hiring Team,\n\n"
        f"I came across your {position} opening and was immediately drawn to the work.\n\n"
        f"{experience_msg} With expertise in {top}, I believe my background aligns well with your goals.\n\n"
        f"Best regards,\n[Your Name]"
    )
    return {"email": f"Subject: {subject}\n\n{body}", "subject": subject, "body": body, "_fallback": True}


def _fallback_resume_analysis(job: JobData, profile: ProfileData) -> dict:
    return {
        "analysis": "Standard analysis: Please ensure your resume highlights specific technical keywords.",
        "strongPoints": ["Relevant career interest", "Technical foundation"],
        "weakPoints": ["Specific skill mapping"],
        "suggestions": ["Add more quantifiable achievements", "Tailor skills to job description"],
        "_fallback": True
    }


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai"}


@app.post("/generate-email")
async def email_endpoint(req: AIRequest):
    try:
        profile_dict = req.profile.model_dump(by_alias=False)
        profile_dict["resume_text"] = req.profile.resumeText or ""
        
        result = await generate_cold_email(req.job.model_dump(), profile_dict)
        
        if not result or not result.get("email"):
            raise ValueError("Empty response from LLM")
            
        return result
    except Exception as e:
        logger.error(f"Email generation failed: {e}")
        return _fallback_email(req.job, req.profile)


@app.post("/generate-bullets")
@app.post("/analyze-resume")
async def analysis_endpoint(req: AIRequest):
    try:
        job_dict = req.job.model_dump()
        profile_dict = req.profile.model_dump(by_alias=False)
        
        res_text = req.profile.resumeText or ""
        profile_dict["resume_text"] = res_text
        
        if len(res_text.strip()) >= 20:
            final_result = {}
            # Retry loop: Try up to 2 times if result is too thin
            for attempt in range(2):
                result = await generate_resume_bullets(job_dict, profile_dict)
                
                # Check for actual content
                strong = result.get("strongPoints") or result.get("strengths") or []
                weak = result.get("weakPoints") or result.get("weaknesses") or []
                
                if len(strong) >= 2 or len(weak) >= 2:
                    final_result = result
                    break
                
                logger.warning(f"Attempt {attempt + 1}: Received thin results. Retrying...")
                final_result = result # Save the thin result anyway in case 2nd try fails
            
            return {
                "analysis": final_result.get("resume") or final_result.get("analysis") or "",
                "strongPoints": final_result.get("strongPoints") or final_result.get("strengths") or [],
                "weakPoints": final_result.get("weakPoints") or final_result.get("weaknesses") or [],
                "suggestions": final_result.get("suggestions", []),
                "_fallback": False
            }
        else:
            return _fallback_resume_analysis(req.job, req.profile)
            
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return _fallback_resume_analysis(req.job, req.profile)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("AI_SERVICE_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_SERVICE_PORT", "8000")),
        reload=True
    )