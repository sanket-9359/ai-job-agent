"""
AI Service — FastAPI app
Endpoints: /generate-email, /generate-bullets, /health
All endpoints handle errors gracefully and NEVER return a 500 without a message.
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
    title:              Optional[str] = None
    company:            Optional[str] = None
    description:        Optional[str] = None
    location:           Optional[str] = None
    skills:             Optional[List[str]] = None
    requiredExperience: Optional[float] = None
    jobType:            Optional[str] = None
    workMode:           Optional[str] = None

class ProfileData(BaseModel):
    targetRole:  Optional[str] = None
    experience:  Optional[str] = None
    skills:      Optional[List[str]] = []
    resumeText:  Optional[str] = None
    resume_text: Optional[str] = None  # alias

class EmailRequest(BaseModel):
    job:     JobData
    profile: ProfileData

class BulletsRequest(BaseModel):
    job:     JobData
    profile: ProfileData


# ── Fallback builders (inline, no imports needed) ─────────────────────────────
def _fallback_email(job: JobData, profile: ProfileData) -> dict:
    skills    = profile.skills or []
    top       = ", ".join(skills[:3]) or "software development"
    company   = job.company or "your company"
    position  = job.title or profile.targetRole or "the role"
    exp       = profile.experience or "several years of"
    subject   = f"Application for {position} – {skills[0] if skills else 'Experienced'} Developer"
    body = (
        f"Dear {company} Hiring Team,\n\n"
        f"I came across your {position} opening and was immediately drawn to the work "
        f"{company} is doing in this space.\n\n"
        f"With {exp} experience in {top}, I've built a strong track record of delivering "
        f"high-quality software. I believe my background aligns well with what you're looking for.\n\n"
        f"I'd love the opportunity to discuss how I can contribute to {company}'s goals.\n\n"
        f"Thank you for your time.\n\nBest regards,\n[Your Name]"
    )
    return {"email": f"Subject: {subject}\n\n{body}", "subject": subject, "body": body}


def _fallback_resume(job: JobData, profile: ProfileData) -> dict:
    skills     = profile.skills or []
    job_skills = job.skills or []
    matched    = [s for s in job_skills if any(s.lower() in u.lower() or u.lower() in s.lower() for u in skills)]
    missing    = [s for s in job_skills if s not in matched]

    strong = [
        f"Experience with {', '.join(skills[:3])}" if skills else "Demonstrated technical skills",
        f"Relevant skills: {', '.join(matched[:3])}" if matched else "Background aligns with role requirements",
        "Professional software development experience",
    ]
    weak = [
        f"Missing required skills: {', '.join(missing[:3])}" if missing else "Some role-specific technologies not highlighted",
        "Could add more measurable impact metrics to strengthen the resume",
    ]
    suggestions = [
        f"Learn or highlight experience with {missing[0]}" if missing else "Quantify achievements with metrics",
        f"Tailor resume summary to emphasize {job.title or 'this role'} experience",
        "Add links to relevant projects or contributions",
    ]

    raw = (
        "STRONG POINTS:\n" + "\n".join(f"• {p}" for p in strong) + "\n\n"
        "WEAK POINTS:\n"   + "\n".join(f"• {p}" for p in weak)   + "\n\n"
        "SUGGESTIONS:\n"   + "\n".join(f"• {p}" for p in suggestions)
    )
    return {"resume": raw, "strongPoints": strong, "weakPoints": weak, "suggestions": suggestions}


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai"}


@app.post("/generate-email")
async def generate_email_endpoint(req: EmailRequest):
    job     = req.job
    profile = req.profile

    # Validate required fields
    if not job.title or not job.company:
        raise HTTPException(status_code=400, detail="job.title and job.company are required.")

    try:
        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY not configured")

        result = await generate_cold_email(job.model_dump(), profile.model_dump())

        if not result.get("email"):
            raise ValueError("Empty response from LLM")

        return result

    except ValueError as e:
        logger.warning(f"Email generation value error: {e} — using fallback")
        return {**_fallback_email(job, profile), "_fallback": True}

    except Exception as e:
        logger.error(f"Email generation failed: {e} — using fallback")
        return {**_fallback_email(job, profile), "_fallback": True}


@app.post("/generate-bullets")
async def generate_bullets_endpoint(req: BulletsRequest):
    job     = req.job
    profile = req.profile

    # Validate
    if not job.title or not job.company:
        raise HTTPException(status_code=400, detail="job.title and job.company are required.")

    resume_text = profile.resumeText or profile.resume_text or ""
    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text is too short (minimum 50 characters). Please upload a complete resume.")

    try:
        if not os.getenv("GROQ_API_KEY"):
            raise ValueError("GROQ_API_KEY not configured")

        # Inject resume_text into profile dict for generator
        profile_dict = profile.model_dump()
        profile_dict["resumeText"] = resume_text

        result = await generate_resume_bullets(job.model_dump(), profile_dict)

        if not result.get("resume"):
            raise ValueError("Empty response from LLM")

        return result

    except ValueError as e:
        logger.warning(f"Resume analysis value error: {e} — using fallback")
        return {**_fallback_resume(job, profile), "_fallback": True}

    except Exception as e:
        logger.error(f"Resume analysis failed: {e} — using fallback")
        return {**_fallback_resume(job, profile), "_fallback": True}


# ── Entry point ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("AI_SERVICE_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_SERVICE_PORT", "8000")),
        reload=os.getenv("ENVIRONMENT", "development") == "development",
    )
