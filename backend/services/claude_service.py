import json
import os
from typing import List

import anthropic

from schemas import CounselResponse, JobOut, ProfileOut


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
        experience_lines.append(
            f"  - {exp.get('role', '?')} at {exp.get('company', '?')} "
            f"({exp.get('years', '?')}): {exp.get('description', '')}"
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

- "roadmap": 3-7 actionable career development steps tailored to this candidate.
- "current_matches": IDs (UUIDs as strings) of jobs from the list above that are strong matches.
- "board_recommendations": 3-5 suggestions for what types of jobs or skills to pursue next.
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


def get_career_counsel(profile: ProfileOut, matching_jobs: List[JobOut]) -> CounselResponse:
    """
    Call the Claude API to generate career counseling for the given profile.

    Parameters
    ----------
    profile:
        The candidate's full profile pulled from the database.
    matching_jobs:
        Jobs pre-filtered by the caller to be relevant to the profile.

    Returns
    -------
    CounselResponse
        Structured counseling output with a roadmap, matched jobs, and
        board-level recommendations.
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()

    user_prompt = _build_prompt(profile, matching_jobs)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=(
            "You are an expert career counselor helping people find jobs and grow their careers. "
            "Return ONLY valid JSON — no prose, no markdown, no explanations outside the JSON object."
        ),
        messages=[
            {"role": "user", "content": user_prompt},
        ],
    )

    raw_text = message.content[0].text if message.content else ""
    return _parse_response(raw_text, matching_jobs)
