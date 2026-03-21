import io
import os
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, Response, StreamingResponse
from pypdf import PdfReader
from sqlalchemy.orm import Session

from database import get_db
from models.job import Job
from models.profile import Profile
from schemas import (
    CoverLetterRequest,
    CoverLetterResponse,
    JobOut,
    ProfileCreate,
    ProfileOut,
)
from services.auth import get_current_user_dep
from services.claude_service import generate_cover_letter, parse_resume, stream_cover_letter

router = APIRouter(prefix="/resume", tags=["resume"])

# Path to tectonic binary (lives next to this backend)
_BACKEND_DIR = Path(__file__).parent.parent
TECTONIC_BIN = str(_BACKEND_DIR / "tectonic")


# ---------------------------------------------------------------------------
# LaTeX helpers
# ---------------------------------------------------------------------------

def _esc(text: str) -> str:
    """Escape special LaTeX characters in a string."""
    replacements = [
        ("\\", r"\textbackslash{}"),
        ("&",  r"\&"),
        ("%",  r"\%"),
        ("$",  r"\$"),
        ("#",  r"\#"),
        ("_",  r"\_"),
        ("{",  r"\{"),
        ("}",  r"\}"),
        ("~",  r"\textasciitilde{}"),
        ("^",  r"\textasciicircum{}"),
        ("<",  r"\textless{}"),
        (">",  r"\textgreater{}"),
    ]
    for char, repl in replacements:
        text = text.replace(char, repl)
    return text


def _build_latex(profile: ProfileOut, full_name: str = "Your Name", email: str = "") -> str:
    """Render Jake's LaTeX resume template from a ProfileOut."""

    # --- Education ---
    edu_items = ""
    for edu in profile.education:
        school  = _esc(edu.get("school", ""))
        degree  = _esc(edu.get("degree", ""))
        year    = _esc(str(edu.get("year", "")))
        if school or degree:
            edu_items += f"""
    \\resumeSubheading
      {{{school}}}{{}}
      {{{degree}}}{{{year}}}"""

    education_section = ""
    if edu_items:
        education_section = f"""
%-----------EDUCATION-----------
\\section{{Education}}
  \\resumeSubHeadingListStart{edu_items}
  \\resumeSubHeadingListEnd
"""

    # --- Experience ---
    exp_items = ""
    for exp in profile.experience:
        company = _esc(exp.get("company", ""))
        role    = _esc(exp.get("role", ""))
        start   = _esc(str(exp.get("start_year", "")))
        end     = _esc(str(exp.get("end_year", "Present")))
        period  = f"{start} -- {end}" if start else end
        desc    = _esc(exp.get("description", ""))
        bullets = f"\n      \\resumeItemListStart\n        \\resumeItem{{{desc}}}\n      \\resumeItemListEnd" if desc else ""
        if company or role:
            exp_items += f"""
    \\resumeSubheading
      {{{company}}}{{{period}}}
      {{{role}}}{{}}
{bullets}"""

    experience_section = ""
    if exp_items:
        experience_section = f"""
%-----------EXPERIENCE-----------
\\section{{Experience}}
  \\resumeSubHeadingListStart{exp_items}
  \\resumeSubHeadingListEnd
"""

    # --- Skills ---
    skills_section = ""
    if profile.skills or profile.certifications:
        skills_line = _esc(", ".join(profile.skills)) if profile.skills else ""
        certs_line  = _esc(", ".join(profile.certifications)) if profile.certifications else ""
        skills_rows = ""
        if skills_line:
            skills_rows += f"     \\textbf{{Skills}}{{: {skills_line}}} \\\\\n"
        if certs_line:
            skills_rows += f"     \\textbf{{Certifications}}{{: {certs_line}}} \\\\\n"
        if profile.target_roles:
            roles_line = _esc(", ".join(profile.target_roles))
            skills_rows += f"     \\textbf{{Target Roles}}{{: {roles_line}}} \\\\\n"
        skills_section = f"""
%-----------TECHNICAL SKILLS-----------
\\section{{Technical Skills}}
 \\begin{{itemize}}[leftmargin=0.15in, label={{}}]
    \\small{{\\item{{
{skills_rows}    }}}}
 \\end{{itemize}}
"""

    name_esc  = _esc(full_name)
    email_esc = _esc(email)

    contact_line = f"\\small {name_esc}"
    if email_esc:
        contact_line += f" $|$ \\href{{mailto:{email_esc}}}{{\\underline{{{email_esc}}}}}"

    return r"""
%-------------------------
% Resume in Latex — Jake's Template (settl.ai)
%------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\addtolength{\oddsidemargin}{-0.5in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1in}
\addtolength{\topmargin}{-.5in}
\addtolength{\textheight}{1.0in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-5pt}]

\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

\begin{document}

\begin{center}
    \textbf{\Huge \scshape """ + name_esc + r"""} \\ \vspace{1pt}
    """ + contact_line + r"""
\end{center}

""" + education_section + experience_section + skills_section + r"""

\end{document}
"""


def _compile_latex(tex_source: str) -> bytes:
    """
    Write tex_source to a temp dir, compile with tectonic, return PDF bytes.
    Raises HTTPException on failure.
    """
    if not os.path.isfile(TECTONIC_BIN):
        raise HTTPException(
            status_code=500,
            detail="LaTeX compiler not found on server. Contact the admin.",
        )

    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, "resume.tex")
        pdf_path = os.path.join(tmpdir, "resume.pdf")

        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(tex_source)

        result = subprocess.run(
            [TECTONIC_BIN, "--outdir", tmpdir, tex_path],
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"LaTeX compilation failed: {result.stderr[-500:]}",
            )

        if not os.path.isfile(pdf_path):
            raise HTTPException(status_code=500, detail="PDF was not produced.")

        with open(pdf_path, "rb") as f:
            return f.read()


# ---------------------------------------------------------------------------
# Resume import
# ---------------------------------------------------------------------------

@router.post("/import", response_model=ProfileOut)
async def import_resume(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Accept a PDF upload, extract its text, parse via Claude, and upsert
    the extracted data into the authenticated user's profile.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    clerk_user_id: str = current_user.get("sub", "")

    contents = await file.read()
    reader = PdfReader(io.BytesIO(contents))
    resume_text = "\n".join(
        page.extract_text() or "" for page in reader.pages
    ).strip()

    if not resume_text:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from PDF. Try a text-based (not scanned) PDF.",
        )

    extracted: dict = parse_resume(resume_text)

    profile_data = ProfileCreate(
        skills=extracted.get("skills", []),
        education=extracted.get("education", []),
        certifications=extracted.get("certifications", []),
        experience=extracted.get("experience", []),
        target_roles=extracted.get("target_roles", []),
    )

    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()

    if profile:
        profile.skills = profile_data.skills
        profile.education = profile_data.education
        profile.certifications = profile_data.certifications
        profile.experience = profile_data.experience
        profile.target_roles = profile_data.target_roles
        profile.updated_at = datetime.now(timezone.utc)
    else:
        profile = Profile(
            clerk_user_id=clerk_user_id,
            skills=profile_data.skills,
            education=profile_data.education,
            certifications=profile_data.certifications,
            experience=profile_data.experience,
            target_roles=profile_data.target_roles,
            updated_at=datetime.now(timezone.utc),
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return ProfileOut.model_validate(profile)


# ---------------------------------------------------------------------------
# Resume generator — Jake's LaTeX template → real PDF via tectonic
# ---------------------------------------------------------------------------

@router.get("/generate")
def generate_resume(
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Compile Jake's LaTeX resume template from the user's profile and
    return a PDF file.
    """
    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile via PUT /api/profile first.",
        )

    profile_schema = ProfileOut.model_validate(profile)
    tex = _build_latex(profile_schema)
    pdf_bytes = _compile_latex(tex)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="resume.pdf"'},
    )


# ---------------------------------------------------------------------------
# Cover letter generator
# ---------------------------------------------------------------------------

@router.post("/cover-letter", response_model=CoverLetterResponse)
def cover_letter(
    payload: CoverLetterRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Generate a tailored cover letter for the authenticated user
    applying to the specified job.
    """
    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile via PUT /api/profile first.",
        )

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    profile_schema = ProfileOut.model_validate(profile)
    job_schema = JobOut.model_validate(job)

    cover_letter_text = generate_cover_letter(profile_schema, job_schema)
    return CoverLetterResponse(cover_letter=cover_letter_text)


@router.post("/cover-letter/stream")
async def cover_letter_stream(
    payload: CoverLetterRequest,
    current_user: Dict[str, Any] = Depends(get_current_user_dep),
    db: Session = Depends(get_db),
):
    """
    Stream a tailored cover letter for the authenticated user using SSE.
    """
    clerk_user_id: str = current_user.get("sub", "")
    profile = db.query(Profile).filter(Profile.clerk_user_id == clerk_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile via PUT /api/profile first.",
        )

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    profile_schema = ProfileOut.model_validate(profile)
    job_schema = JobOut.model_validate(job)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for chunk in stream_cover_letter(job_schema, profile_schema):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            yield f"data: [ERROR] {exc}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
