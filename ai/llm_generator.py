import os
import logging
import re
from typing import Optional, List

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import (
    StrOutputParser,
    JsonOutputParser,
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# LLM SINGLETON
# ─────────────────────────────────────────────────────────────────────────────

_llm = None


def get_llm() -> ChatGroq:
    global _llm

    if _llm is None:
        api_key = os.getenv("GROQ_API_KEY", "")

        if not api_key:
            raise ValueError("GROQ_API_KEY is not set.")

        # FASTER + LOWER TOKEN MODEL
        # WORKING + FAST + SUPPORTED MODEL
        model = "llama-3.1-8b-instant"

        _llm = ChatGroq(
            groq_api_key=api_key,
            model_name=model,
            temperature=0.3,
            max_tokens=250,
        )

        logger.info(f"LLM initialized with model: {model}")

    return _llm


# ─────────────────────────────────────────────────────────────────────────────
# EMAIL PROMPTS
# ─────────────────────────────────────────────────────────────────────────────

EMAIL_SYSTEM = """
You are an expert job application assistant.

Rules:
- First line MUST start with:
Subject:

- Keep email under 150 words
- Make it professional
- Mention candidate skills briefly
- End with:
Best regards,
[Your Name]
"""

EMAIL_HUMAN = """
JOB TITLE: {position}

COMPANY: {company}

JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}

SKILLS:
{skills}

Write a concise cold email.
"""


# ─────────────────────────────────────────────────────────────────────────────
# RESUME ANALYSIS PROMPTS
# ─────────────────────────────────────────────────────────────────────────────

RESUME_SYSTEM = """
You are an expert resume reviewer.

Return EXACTLY these sections:

STRONG POINTS:
• point
• point

WEAK POINTS:
• point
• point

SUGGESTIONS:
• point
• point

Rules:
- Keep response concise
- Max 2-3 points per section
- No extra text
"""

RESUME_HUMAN = """
JOB TITLE:
{position}

COMPANY:
{company}

JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}
"""


# ─────────────────────────────────────────────────────────────────────────────
# MATCH ANALYSIS PROMPTS
# ─────────────────────────────────────────────────────────────────────────────

RESUME_MATCH_SYSTEM = """
Return ONLY valid JSON.

Format:
{
  "strengths": ["point"],
  "weaknesses": ["point"],
  "match_percentage": 75
}
"""

RESUME_MATCH_HUMAN = """
RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

{job_title_info}
"""


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _parse_sections(text: str) -> dict:

    def extract(label: str) -> List[str]:

        pattern = (
            rf"(?i){label}:\s*(.*?)(?=STRONG POINTS:|WEAK POINTS:|SUGGESTIONS:|$)"
        )

        match = re.search(pattern, text, re.DOTALL)

        if not match:
            return []

        block = match.group(1).strip()

        lines = block.split("\n")

        cleaned = []

        for line in lines:
            clean = re.sub(r"^[•\-\*\d\.]+\s*", "", line).strip()

            if len(clean) > 3:
                cleaned.append(clean)

        return cleaned

    return {
        "strongPoints": extract("STRONG POINTS"),
        "weakPoints": extract("WEAK POINTS"),
        "suggestions": extract("SUGGESTIONS"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# CHAINS
# ─────────────────────────────────────────────────────────────────────────────

def build_email_chain():

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", EMAIL_SYSTEM),
            ("human", EMAIL_HUMAN),
        ]
    )

    return prompt | get_llm() | StrOutputParser()


def build_resume_chain():

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", RESUME_SYSTEM),
            ("human", RESUME_HUMAN),
        ]
    )

    return prompt | get_llm() | StrOutputParser()


def build_resume_match_chain():

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", RESUME_MATCH_SYSTEM),
            ("human", RESUME_MATCH_HUMAN),
        ]
    )

    return prompt | get_llm() | JsonOutputParser()


# ─────────────────────────────────────────────────────────────────────────────
# GENERATE EMAIL
# ─────────────────────────────────────────────────────────────────────────────

async def generate_cold_email(job: dict, profile: dict) -> dict:

    chain = build_email_chain()

    resume_text = (
        profile.get("resume_text")
        or profile.get("resumeText")
        or ""
    )

    variables = {
        "company": job.get("company", "Company"),
        "position": job.get("title", "Role"),
        "job_description": (
            job.get("description") or ""
        )[:1000],
        "resume_text": resume_text[:1500],
        "skills": ", ".join(profile.get("skills", [])),
    }

    logger.info(
        f"📧 Generating email for: {variables['position']} @ {variables['company']}"
    )

    raw = await chain.ainvoke(variables)

    lines = raw.strip().split("\n")

    subject = ""
    body = raw

    if lines and lines[0].lower().startswith("subject:"):
        subject = lines[0].replace("Subject:", "").strip()
        body = "\n".join(lines[1:]).strip()

    return {
        "email": raw.strip(),
        "subject": subject,
        "body": body,
    }


# ─────────────────────────────────────────────────────────────────────────────
# RESUME ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

async def generate_resume_bullets(job: dict, profile: dict) -> dict:

    chain = build_resume_chain()

    resume_text = (
        profile.get("resume_text")
        or profile.get("resumeText")
        or ""
    )

    variables = {
        "resume_text": resume_text[:2000],
        "position": job.get("title", "Role"),
        "company": job.get("company", "Company"),
        "job_description": (
            job.get("description") or ""
        )[:1000],
    }

    logger.info(
        f"📄 Analyzing resume for: {variables['position']}"
    )

    raw = await chain.ainvoke(variables)

    sections = _parse_sections(raw)

    return {
        "resume": raw.strip(),
        **sections,
    }


# ─────────────────────────────────────────────────────────────────────────────
# MATCH ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────

async def analyze_resume_match(
    resume_text: str,
    job_description: str,
    job_title: Optional[str] = None,
    company_name: Optional[str] = None,
) -> dict:

    chain = build_resume_match_chain()

    job_title_info = ""

    if job_title:
        job_title_info = f"JOB TITLE: {job_title}"

    if company_name:
        job_title_info += f" at {company_name}"

    variables = {
        "resume_text": resume_text[:2000],
        "job_description": job_description[:1000],
        "job_title_info": job_title_info,
    }

    logger.info(
        f"📊 Analyzing match for: {job_title or 'position'}"
    )

    result = await chain.ainvoke(variables)

    return {
        "strengths": result.get("strengths", []),
        "weaknesses": result.get("weaknesses", []),
        "match_percentage": int(
            result.get("match_percentage", 50)
        ),
    }