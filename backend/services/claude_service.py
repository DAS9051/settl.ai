import json
import os
from typing import AsyncGenerator, List

import anthropic

from schemas import (
    CounselResponse,
    FirstWeekPrepResponse,
    GlossaryTerm,
    InterviewPrepResponse,
    InterviewQuestion,
    JargonTranslationResponse,
    JobOut,
    OutreachResponse,
    PaycheckDeduction,
    PaycheckExplanation,
    ProfileOut,
    QuizEvaluationResponse,
    QuizQuestion,
    SkillsGapResponse,
    SalaryInsightResponse,
)


def _lang_prefix(language: str) -> str:
    if language and language.lower() != "english":
        return f"Always respond in {language}. "
    return ""


def _build_prompt(profile: ProfileOut, matching_jobs: List[JobOut]) -> str:
    """Build the user-turn prompt sent to Claude."""
    jobs_text = ""
    if matching_jobs:
        job_lines = []
        for job in matching_jobs:
            skills = ", ".join(job.skills_required) if job.skills_required else "not specified"
            salary = job.salary_range or "not specified"
            job_lines.append(
                f"- [{job.id}] {job.title} at business {job.business_id} "
                f"| Location: {job.location} | Salary: {salary} | Skills: {skills}"
            )
        jobs_text = "\n".join(job_lines)
    else:
        jobs_text = "No matching jobs found in the local board at this time."

    profile_skills = ", ".join(profile.skills) if profile.skills else "none listed"
    profile_certs = ", ".join(profile.certifications) if profile.certifications else "none"
    profile_targets = ", ".join(profile.target_roles) if profile.target_roles else "not specified"

    education_lines = []
    for edu in profile.education:
        education_lines.append(
            f"  - {edu.get('degree', '?')} from {edu.get('school', '?')} ({edu.get('year', '?')})"
        )
    education_text = "\n".join(education_lines) if education_lines else "  - None listed"

    experience_lines = []
    for exp in profile.experience:
        start = exp.get('start_year', '')
        end = exp.get('end_year', 'Present')
        period = f"{start}–{end}" if start else end
        experience_lines.append(
            f"  - {exp.get('role', '?')} at {exp.get('company', '?')} "
            f"({period}): {exp.get('description', '')}"
        )
    experience_text = "\n".join(experience_lines) if experience_lines else "  - None listed"

    return f"""Here is the candidate's profile:

Skills: {profile_skills}
Certifications: {profile_certs}
Target Roles: {profile_targets}

Education:
{education_text}

Experience:
{experience_text}

Available local job postings that may match:
{jobs_text}

Please provide career counseling advice. Return ONLY a JSON object with exactly these keys:
{{
  "roadmap": ["step 1", "step 2", ...],
  "current_matches": [<list of job IDs from above that are good matches, as strings>],
  "board_recommendations": ["recommendation 1", "recommendation 2", ...]
}}

- "roadmap": 3-7 actionable career development steps tailored to this candidate. When recomending skills, provide links or names of real, valid, and free courses or certifications such as coursera that are relevant to the recommendations
- "current_matches": IDs (UUIDs as strings) of jobs from the list above that are strong matches.
- "board_recommendations": 3-5 suggestions for what types of jobs or skills to pursue next. When recomending skills, provide links or names of real, valid, and free courses or certifications such as coursera that are relevant to the recommendations.
"""


def _parse_response(raw_text: str, matching_jobs: List[JobOut]) -> CounselResponse:
    """
    Parse Claude's JSON response into a CounselResponse.
    Falls back to a safe default if JSON parsing fails.
    """
    # Strip markdown code fences if present
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop first and last fence lines
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Fallback: return empty structured response with a generic roadmap message
        return CounselResponse(
            roadmap=["Review your skills and update your profile for better recommendations."],
            current_matches=[],
            board_recommendations=["Explore local job postings and apply to roles matching your skills."],
        )

    # Resolve matched job IDs back to full JobOut objects
    job_map = {str(job.id): job for job in matching_jobs}
    matched_job_ids: List[str] = data.get("current_matches", [])
    resolved_jobs = [job_map[jid] for jid in matched_job_ids if jid in job_map]

    return CounselResponse(
        roadmap=data.get("roadmap", []),
        current_matches=resolved_jobs,
        board_recommendations=data.get("board_recommendations", []),
    )


def get_career_counsel(profile: ProfileOut, matching_jobs: List[JobOut], language: str = "English") -> CounselResponse:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    user_prompt = _build_prompt(profile, matching_jobs)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            f"{_lang_prefix(language)}You are an expert career counselor helping people find jobs and grow their careers. "
            "Return ONLY valid JSON — no prose, no markdown, no explanations outside the JSON object."
        ),
        messages=[
            {"role": "user", "content": user_prompt},
        ],
    )

    raw_text = message.content[0].text if message.content else ""
    return _parse_response(raw_text, matching_jobs)


def _strip_fences(text: str) -> str:
    """Strip markdown code fences if present."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return text


def analyze_skills_gap(profile: ProfileOut, job: JobOut, language: str = "English") -> SkillsGapResponse:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    profile_skills = ", ".join(profile.skills) if profile.skills else "none listed"
    job_skills = ", ".join(job.skills_required) if job.skills_required else "none specified"

    user_prompt = f"""Candidate skills: {profile_skills}

Job title: {job.title}
Job required skills: {job_skills}

Analyse the skills gap and return ONLY a JSON object with exactly these keys:
{{
  "missing_skills": ["skill1", "skill2"],
  "matching_skills": ["skill3", "skill4"],
  "gap_analysis": "2-3 sentence summary of the gap",
  "recommendations": ["concrete step 1", "concrete step 2"]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=f"{_lang_prefix(language)}You are a career advisor. Return ONLY valid JSON.",
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return SkillsGapResponse(
            missing_skills=[],
            matching_skills=[],
            gap_analysis="Unable to analyse skills gap at this time.",
            recommendations=["Review the job description and compare it to your profile manually."],
        )

    return SkillsGapResponse(
        missing_skills=data.get("missing_skills", []),
        matching_skills=data.get("matching_skills", []),
        gap_analysis=data.get("gap_analysis", ""),
        recommendations=data.get("recommendations", []),
    )


def get_salary_insight(role: str, location: str, skills: List[str], language: str = "English") -> SalaryInsightResponse:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    skills_text = ", ".join(skills) if skills else "not specified"

    user_prompt = f"""Role: {role}
Location: {location}
Skills: {skills_text}

Estimate the annual USD salary range for this role and return ONLY a JSON object with exactly these keys:
{{
  "role": "{role}",
  "location": "{location}",
  "estimated_min": <integer USD>,
  "estimated_max": <integer USD>,
  "median": <integer USD>,
  "notes": "1-2 sentence context about this estimate"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=f"{_lang_prefix(language)}You are a compensation analyst. Return ONLY valid JSON.",
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return SalaryInsightResponse(
            role=role,
            location=location,
            estimated_min=0,
            estimated_max=0,
            median=0,
            notes="Unable to estimate salary at this time.",
        )

    return SalaryInsightResponse(
        role=data.get("role", role),
        location=data.get("location", location),
        estimated_min=int(data.get("estimated_min", 0)),
        estimated_max=int(data.get("estimated_max", 0)),
        median=int(data.get("median", 0)),
        notes=data.get("notes", ""),
    )


def parse_resume(resume_text: str) -> dict:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    user_prompt = f"""Resume text:
---
{resume_text}
---

Extract structured career data and return ONLY a JSON object with exactly these keys:
{{
  "skills": ["skill1", "skill2"],
  "education": [{{"school": "...", "degree": "...", "year": "..."}}],
  "experience": [{{"company": "...", "role": "...", "start_year": "...", "end_year": "...", "description": "..."}}],
  "certifications": ["cert1"],
  "target_roles": ["role1", "role2"]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system="Extract structured data from this resume. Return ONLY valid JSON.",
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {
            "skills": [],
            "education": [],
            "experience": [],
            "certifications": [],
            "target_roles": [],
        }

    return {
        "skills": data.get("skills", []),
        "education": data.get("education", []),
        "experience": data.get("experience", []),
        "certifications": data.get("certifications", []),
        "target_roles": data.get("target_roles", []),
    }


def generate_cover_letter(profile: ProfileOut, job: JobOut, language: str = "English") -> str:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    profile_skills = ", ".join(profile.skills) if profile.skills else "none listed"
    profile_targets = ", ".join(profile.target_roles) if profile.target_roles else "not specified"

    experience_lines = []
    for exp in profile.experience:
        start = exp.get('start_year', '')
        end = exp.get('end_year', 'Present')
        period = f"{start}–{end}" if start else end
        experience_lines.append(
            f"  - {exp.get('role', '?')} at {exp.get('company', '?')} "
            f"({period}): {exp.get('description', '')}"
        )
    experience_text = "\n".join(experience_lines) if experience_lines else "  - None listed"

    job_skills = ", ".join(job.skills_required) if job.skills_required else "not specified"
    salary = job.salary_range or "not specified"

    user_prompt = f"""Write a professional cover letter for the following candidate applying to this job.

Candidate profile:
  Skills: {profile_skills}
  Target roles: {profile_targets}
  Experience:
{experience_text}

Job:
  Title: {job.title}
  Location: {job.location}
  Salary: {salary}
  Required skills: {job_skills}
  Description: {job.description}

Write a 3-4 paragraph cover letter in professional tone. Do NOT include a date line or address headers — start directly with "Dear Hiring Manager,"."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            f"{_lang_prefix(language)}You are a professional career writer. "
            "Write concise, compelling cover letters tailored to the role."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    )

    return message.content[0].text if message.content else ""


async def stream_career_counsel(profile: ProfileOut, matching_jobs: List[JobOut], language: str = "English") -> AsyncGenerator[str, None]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    async_client = anthropic.AsyncAnthropic(api_key=api_key) if api_key else anthropic.AsyncAnthropic()

    user_prompt = _build_prompt(profile, matching_jobs)

    async with async_client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            f"{_lang_prefix(language)}You are an expert career counselor helping people find jobs and grow their careers. "
            "Return ONLY valid JSON — no prose, no markdown, no explanations outside the JSON object."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def stream_cover_letter(job: JobOut, profile: ProfileOut, language: str = "English") -> AsyncGenerator[str, None]:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    async_client = anthropic.AsyncAnthropic(api_key=api_key) if api_key else anthropic.AsyncAnthropic()

    profile_skills = ", ".join(profile.skills) if profile.skills else "none listed"
    profile_targets = ", ".join(profile.target_roles) if profile.target_roles else "not specified"

    experience_lines = []
    for exp in profile.experience:
        start = exp.get('start_year', '')
        end = exp.get('end_year', 'Present')
        period = f"{start}–{end}" if start else end
        experience_lines.append(
            f"  - {exp.get('role', '?')} at {exp.get('company', '?')} "
            f"({period}): {exp.get('description', '')}"
        )
    experience_text = "\n".join(experience_lines) if experience_lines else "  - None listed"

    job_skills = ", ".join(job.skills_required) if job.skills_required else "not specified"
    salary = job.salary_range or "not specified"

    user_prompt = f"""Write a professional cover letter for the following candidate applying to this job.

Candidate profile:
  Skills: {profile_skills}
  Target roles: {profile_targets}
  Experience:
{experience_text}

Job:
  Title: {job.title}
  Location: {job.location}
  Salary: {salary}
  Required skills: {job_skills}
  Description: {job.description}

Write a 3-4 paragraph cover letter in professional tone. Do NOT include a date line or address headers — start directly with "Dear Hiring Manager,\""""

    async with async_client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            f"{_lang_prefix(language)}You are a professional career writer. "
            "Write concise, compelling cover letters tailored to the role."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


def generate_interview_prep(job: JobOut, profile: ProfileOut, language: str = "English") -> InterviewPrepResponse:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    profile_skills = ", ".join(profile.skills) if profile.skills else "none listed"
    profile_targets = ", ".join(profile.target_roles) if profile.target_roles else "not specified"

    experience_lines = []
    for exp in profile.experience:
        start = exp.get('start_year', '')
        end = exp.get('end_year', 'Present')
        period = f"{start}–{end}" if start else end
        experience_lines.append(
            f"  - {exp.get('role', '?')} at {exp.get('company', '?')} "
            f"({period}): {exp.get('description', '')}"
        )
    experience_text = "\n".join(experience_lines) if experience_lines else "  - None listed"

    job_skills = ", ".join(job.skills_required) if job.skills_required else "not specified"

    user_prompt = f"""Given this job description and the candidate's profile, generate 5-7 likely interview questions with concrete answer frameworks specific to the role and candidate's background (not generic advice).

Candidate profile:
  Skills: {profile_skills}
  Target roles: {profile_targets}
  Experience:
{experience_text}

Job:
  Title: {job.title}
  Location: {job.location}
  Required skills: {job_skills}
  Description: {job.description}

Return ONLY a JSON object with exactly this structure:
{{
  "questions": [
    {{"question": "...", "answer_framework": "..."}},
    ...
  ]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=f"{_lang_prefix(language)}You are an expert interview coach. Return ONLY valid JSON.",
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return InterviewPrepResponse(questions=[
            InterviewQuestion(
                question="Tell me about yourself and your relevant experience.",
                answer_framework="Use the STAR method: describe your background, key skills, and how they relate to this role.",
            )
        ])

    questions = [
        InterviewQuestion(
            question=q.get("question", ""),
            answer_framework=q.get("answer_framework", ""),
        )
        for q in data.get("questions", [])
    ]
    return InterviewPrepResponse(questions=questions)


def translate_jargon(description: str, language: str = "English") -> JargonTranslationResponse:
    """Identify Canadian/English workplace jargon and return annotated text + glossary."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    user_prompt = f"""Job posting text:
---
{description}
---

Identify any Canadian/English workplace jargon, slang, or culturally specific phrases in this job posting.
Return ONLY a JSON object with exactly these keys:
{{
  "translated": "<the original text with jargon terms annotated inline like: term [plain explanation]>",
  "glossary": [
    {{"term": "circle back", "explanation": "to follow up or revisit a topic later"}},
    ...
  ]
}}

If there is no jargon, return the original text unchanged with an empty glossary array."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=(
            f"{_lang_prefix(language)}You are a cultural language expert helping immigrants understand "
            "Canadian/English workplace language. Return ONLY valid JSON."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return JargonTranslationResponse(
            original=description,
            translated=description,
            glossary=[],
        )

    glossary = [
        GlossaryTerm(term=g.get("term", ""), explanation=g.get("explanation", ""))
        for g in data.get("glossary", [])
    ]
    return JargonTranslationResponse(
        original=description,
        translated=data.get("translated", description),
        glossary=glossary,
    )


def get_first_week_prep(job: JobOut, language: str = "English") -> FirstWeekPrepResponse:
    """Generate 5 practical cultural tips for an immigrant's first week at this job."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    user_prompt = f"""Job:
  Title: {job.title}
  Location: {job.location}
  Description: {job.description}

Generate exactly 5 hyper-practical tips to help an immigrant worker prepare for their first week at this Canadian workplace. Cover topics like: what to wear, how to introduce yourself, what to bring, meeting etiquette, communication norms.

Return ONLY a JSON object:
{{
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            f"{_lang_prefix(language)}You are a cultural integration advisor helping immigrants succeed "
            "in Canadian workplaces. Return ONLY valid JSON."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
        tips = data.get("tips", [])
    except json.JSONDecodeError:
        tips = [
            "Dress business-casual unless told otherwise — smart jeans and a clean shirt are usually fine.",
            "Arrive 5-10 minutes early on your first day to show punctuality.",
            "Bring a notepad and pen to take notes during onboarding.",
            "Introduce yourself with a firm handshake and a brief sentence about your background.",
            "Ask questions freely — Canadian workplaces value curiosity and initiative.",
        ]

    return FirstWeekPrepResponse(tips=tips)


def generate_outreach_message(job: JobOut, profile: ProfileOut, language: str = "English") -> OutreachResponse:
    """Generate a short cold outreach email for an immigrant job seeker."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    profile_skills = ", ".join(profile.skills) if profile.skills else "none listed"
    profile_targets = ", ".join(profile.target_roles) if profile.target_roles else "not specified"
    experience_lines = []
    for exp in profile.experience:
        start = exp.get('start_year', '')
        end = exp.get('end_year', 'Present')
        period = f"{start}–{end}" if start else end
        experience_lines.append(f"{exp.get('role', '?')} at {exp.get('company', '?')} ({period})")
    experience_text = "; ".join(experience_lines) if experience_lines else "Not listed"

    user_prompt = f"""You are helping an immigrant job seeker write a short cold outreach email to a Canadian company to inquire about job opportunities and introduce themselves.

Candidate profile:
  Skills: {profile_skills}
  Target roles: {profile_targets}
  Experience: {experience_text}

Company/Role they are reaching out about:
  Role of interest: {job.title}
  Company: {job.business_name or "the company"}
  Location: {job.location}
  Context: {job.description[:300]}

Write a subject line and a 3-sentence cold outreach email body. The tone should be:
- Proactively inquiring whether the company is currently hiring or open to candidates
- Briefly highlighting 1-2 of the candidate's most relevant skills or experiences
- Expressing genuine interest in the company specifically
- Do NOT say "thank you for the opportunity to apply" or imply they saw a job posting
- Be warm, direct, and culturally appropriate for Canadian professional norms

Return ONLY a JSON object:
{{
  "subject": "...",
  "body": "..."
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=(
            f"{_lang_prefix(language)}You are an expert at writing professional Canadian business emails. "
            "Return ONLY valid JSON."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return OutreachResponse(
            subject=f"Application for {job.title}",
            body="Dear Hiring Manager, I am writing to express my interest in the position at your company. My skills and experience make me a strong candidate. I would welcome the opportunity to discuss how I can contribute to your team.",
        )

    return OutreachResponse(
        subject=data.get("subject", f"Application for {job.title}"),
        body=data.get("body", ""),
    )


def explain_paycheck(salary: float, province: str, language: str = "English") -> PaycheckExplanation:
    """Explain Canadian paycheck deductions for a given gross salary and province."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    user_prompt = f"""An immigrant worker in Canada earns a gross annual salary of ${salary:,.2f} and works in {province}.

Explain their paycheck deductions clearly. Calculate approximate annual amounts for:
1. Federal income tax
2. Provincial income tax (for {province})
3. CPP (Canada Pension Plan) contributions
4. EI (Employment Insurance) premiums

Then estimate the annual net (take-home) pay.

Return ONLY a JSON object:
{{
  "gross": {salary},
  "estimated_net": <number>,
  "deductions": [
    {{"name": "Federal Income Tax", "amount": <number>, "explanation": "...1-2 sentences explaining what this is and why it's deducted"}},
    {{"name": "Provincial Income Tax ({province})", "amount": <number>, "explanation": "..."}},
    {{"name": "CPP Contributions", "amount": <number>, "explanation": "..."}},
    {{"name": "EI Premiums", "amount": <number>, "explanation": "..."}}
  ],
  "plain_summary": "...2-3 sentences in plain language summarizing what the worker takes home and why deductions exist"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            f"{_lang_prefix(language)}You are a Canadian financial literacy educator helping immigrants understand "
            "their paycheque deductions. Be accurate and compassionate. Return ONLY valid JSON."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return PaycheckExplanation(
            gross=salary,
            estimated_net=salary * 0.75,
            deductions=[
                PaycheckDeduction(name="Estimated Total Deductions", amount=salary * 0.25,
                                  explanation="Includes federal/provincial income tax, CPP, and EI. Unable to calculate precisely at this time.")
            ],
            plain_summary="Your take-home pay is approximately 75% of your gross salary after Canadian tax and benefit deductions.",
        )

    deductions = [
        PaycheckDeduction(
            name=d.get("name", ""),
            amount=float(d.get("amount", 0)),
            explanation=d.get("explanation", ""),
        )
        for d in data.get("deductions", [])
    ]

    return PaycheckExplanation(
        gross=float(data.get("gross", salary)),
        estimated_net=float(data.get("estimated_net", 0)),
        deductions=deductions,
        plain_summary=data.get("plain_summary", ""),
    )


def generate_quiz_question(category: str, language: str = "English") -> QuizQuestion:
    """Generate a Canadian workplace culture quiz question with 4 options."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    user_prompt = f"""Generate a multiple-choice quiz question about Canadian workplace culture in the category: "{category}".

The question should help immigrants understand Canadian work norms while respecting diverse cultural backgrounds.

Return ONLY a JSON object:
{{
  "question": "...",
  "options": ["option A", "option B", "option C", "option D"],
  "category": "{category}"
}}

Make sure exactly one option is clearly correct based on typical Canadian workplace norms."""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=(
            f"{_lang_prefix(language)}You are a Canadian workplace culture educator. "
            "Return ONLY valid JSON."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return QuizQuestion(
            question="In a Canadian workplace, when is it appropriate to arrive for a meeting?",
            options=["15 minutes late", "Exactly on time or 1-2 minutes early", "30 minutes early", "Whenever you feel ready"],
            category=category,
        )

    return QuizQuestion(
        question=data.get("question", ""),
        options=data.get("options", []),
        category=data.get("category", category),
    )


def evaluate_quiz_answer(question: str, options: List[str], selected_answer: str, language: str = "English") -> QuizEvaluationResponse:
    """Evaluate a quiz answer and provide cultural context feedback."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    options_text = "\n".join(f"- {o}" for o in options)

    user_prompt = f"""Quiz question: {question}

Options:
{options_text}

The user selected: "{selected_answer}"

Evaluate whether this answer is correct for a Canadian workplace context.
Return ONLY a JSON object:
{{
  "correct": true or false,
  "correct_answer": "<the correct option text>",
  "feedback": "<2-3 sentences explaining why this is correct/incorrect and providing helpful cultural context>"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=(
            f"{_lang_prefix(language)}You are a Canadian workplace culture educator giving constructive, "
            "encouraging feedback. Return ONLY valid JSON."
        ),
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = message.content[0].text if message.content else ""
    text = _strip_fences(raw_text)

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return QuizEvaluationResponse(
            correct=False,
            correct_answer=options[0] if options else selected_answer,
            feedback="Unable to evaluate answer at this time. Please try again.",
        )

    return QuizEvaluationResponse(
        correct=bool(data.get("correct", False)),
        correct_answer=data.get("correct_answer", ""),
        feedback=data.get("feedback", ""),
    )
