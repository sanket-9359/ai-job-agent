"""
LLM Generator — LangChain + Groq chains for cold email and resume analysis.
All functions are async and return plain strings/dicts.
"""

import os
import logging
import re
from typing import Optional, List
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)

# ── LLM singleton ─────────────────────────────────────────────────────────────

# Global variable to hold the LLM instance
_llm = None 

def get_llm() -> ChatGroq:
    """
    Initializes and returns a singleton instance of the Groq LLM.
    Uses llama-3.1-8b-instant as the default supported model.
    """
    global _llm
    if _llm is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment variables.")
        
        # We use llama-3.1-8b-instant because llama3-8b-8192 is decommissioned
        model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        temperature = float(os.getenv("GROQ_TEMPERATURE", "0.7"))
        max_tokens = int(os.getenv("GROQ_MAX_TOKENS", "1024"))

        _llm = ChatGroq(
            groq_api_key=api_key,
            model_name=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        logger.info(f"LLM initialized with model: {model}")
    return _llm


# ── Email Prompt ──────────────────────────────────────────────────────────────
EMAIL_SYSTEM = """You are an expert job application coach who writes highly personalized, compelling cold emails.

RULES — follow all of them:
1. The email must be UNIQUE to this specific job and company — do NOT use generic templates.
2. Mention the company name ({company}) naturally in the opening.
3. Reference at least 2–3 SPECIFIC requirements from the job description.
4. Highlight exactly the candidate skills that match what the job asks for.
5. Explain WHY this candidate fits THIS SPECIFIC ROLE (not a generic "I am a developer" statement).
6. Keep it under 200 words. Be confident, direct, and human.
7. NEVER start with "I am writing to express my interest" or similar clichés.
8. Format: first line is "Subject: <subject line>", then a blank line, then the email body.
9. Sign off as [Your Name] — do not invent a name."""

EMAIL_HUMAN = """You are applying to {company} for the role of {position}.

JOB DESCRIPTION:
{job_description}

YOUR PROFILE:
- Target Role: {target_role}
- Experience: {experience_level}
- Key Skills: {skills}
- Resume Summary: {resume_text}

Write a unique, compelling cold email that will get read. Reference specific parts of the job description above."""


# ── Resume Analysis Prompt ─────────────────────────────────────────────────────
RESUME_SYSTEM = """You are an expert career coach analyzing a candidate's resume against a specific job description.

Return your analysis in EXACTLY this format with no deviations:

STRONG POINTS:
• <point 1>
• <point 2>
• <point 3>

WEAK POINTS:
• <point 1>
• <point 2>

SUGGESTIONS:
• <actionable suggestion 1>
• <actionable suggestion 2>
• <actionable suggestion 3>

Rules:
- Reference ACTUAL content from the resume, not generic observations.
- Be specific — mention skill names, years of experience, technologies.
- Weak points must reference actual gaps relative to the job description.
- Suggestions must be actionable and relevant to THIS specific role."""

RESUME_HUMAN = """RESUME:
{resume_text}

JOB DESCRIPTION:
Role: {position} at {company}
Description: {job_description}

CANDIDATE SKILLS: {skills}

Analyze this resume against the job description above. Be specific and reference actual content."""


# ── Chain Builders ─────────────────────────────────────────────────────────────
def build_email_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system", EMAIL_SYSTEM),
        ("human", EMAIL_HUMAN),
    ])
    return prompt | get_llm() | StrOutputParser()


def build_resume_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system", RESUME_SYSTEM),
        ("human", RESUME_HUMAN),
    ])
    return prompt | get_llm() | StrOutputParser()


# ── Public Functions ───────────────────────────────────────────────────────────
async def generate_cold_email(job: dict, profile: dict) -> dict:
    """
    Generate a personalized cold email.
    """
    chain = build_email_chain()

    resume_text = profile.get("resumeText") or profile.get("resume_text") or "Not provided"
    if len(resume_text) > 3000:
        resume_text = resume_text[:3000] + "..."

    description = job.get("description") or ""
    if len(description) > 2000:
        description = description[:2000] + "..."

    variables = {
        "company":         job.get("company", "the company"),
        "position":        job.get("title", profile.get("targetRole", "the role")),
        "job_description": description or "No description provided.",
        "target_role":     profile.get("targetRole", job.get("title", "Software Engineer")),
        "experience_level": profile.get("experience", "Not specified"),
        "skills":          ", ".join(profile.get("skills", [])) or "Not specified",
        "resume_text":     resume_text,
    }

    logger.info(f"📧 Generating email for: {variables['position']} @ {variables['company']}")
    raw = await chain.ainvoke(variables)

    # Parse subject and body
    lines = raw.strip().split("\n")
    subject = ""
    body_lines = []
    found_subject = False

    for line in lines:
        if line.lower().startswith("subject:") and not found_subject:
            subject = line[8:].strip()
            found_subject = True
        elif found_subject:
            body_lines.append(line)

    body = "\n".join(body_lines).strip()
    if not body:
        body = raw.strip()

    full_email = f"Subject: {subject}\n\n{body}" if subject else raw.strip()
    logger.info(f"✅ Email generated ({len(full_email)} chars)")

    return {"email": full_email, "subject": subject, "body": body}


async def generate_resume_bullets(job: dict, profile: dict) -> dict:
    """
    Analyze a resume against a job description.
    """
    chain = build_resume_chain()

    resume_text = profile.get("resumeText") or profile.get("resume_text") or ""
    description = job.get("description") or ""
    if len(description) > 2000:
        description = description[:2000] + "..."

    variables = {
        "resume_text":     resume_text[:4000],
        "position":        job.get("title", "the role"),
        "company":         job.get("company", "the company"),
        "job_description": description or "No description provided.",
        "skills":          ", ".join(profile.get("skills", [])) or "Not specified",
    }

    logger.info(f"📄 Analyzing resume for: {variables['position']} @ {variables['company']}")
    raw = await chain.ainvoke(variables)
    logger.info(f"✅ Resume analysis generated ({len(raw)} chars)")

    return {
        "resume": raw.strip(),
        **_parse_sections(raw),
    }


def _parse_sections(text: str) -> dict:
    """Parse STRONG POINTS / WEAK POINTS / SUGGESTIONS from raw text."""
    def extract(label: str) -> List[str]:
        pattern = rf"{label}[:\s]*(.*?)(?=STRONG POINTS|WEAK POINTS|SUGGESTIONS|$)"
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if not match:
            return []
        block = match.group(1).strip()
        lines = [re.sub(r"^[•\-\*\d\.]+\s*", "", l).strip() for l in block.split("\n")]
        return [l for l in lines if len(l) > 5]

    return {
        "strongPoints": extract("STRONG POINTS"),
        "weakPoints":   extract("WEAK POINTS"),
        "suggestions":  extract("SUGGESTIONS"),
    }