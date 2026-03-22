# settl.ai — Feature Reference

settl.ai is an immigration-focused Canadian career platform that combines a job board, personal job tracker, AI-powered career tools, and educational resources to help newcomers navigate the Canadian workforce.

---

## 1. Authentication

**What it does:** Handles user sign-up, sign-in, and session management. Business users are identified by a role flag in their account metadata.

**How it works:** Uses [Clerk](https://clerk.com) for authentication. The frontend uses Clerk's React components (`<SignedIn>`, `<SignedOut>`, `UserButton`, `useAuth`, `useUser`). The backend validates JWTs by fetching Clerk's JWKS endpoint and verifying the token signature. The `get_current_user_dep` FastAPI dependency extracts the `sub` (Clerk user ID) from verified tokens. Role (`worker` or `business`) is stored in Clerk public metadata via `PATCH /v1/users/{id}/metadata`.

**Key files:**
- `frontend/app/sign-in/[[...sign-in]]/page.tsx` — Clerk-hosted sign-in page
- `frontend/app/sign-up/[[...sign-up]]/page.tsx` — Clerk-hosted sign-up page
- `frontend/middleware.ts` — Clerk middleware protecting private routes
- `backend/services/auth.py` — JWKS-based JWT validation, `get_current_user_dep`
- `backend/routes/auth.py` — `POST /api/auth/role` to set worker/business role

---

## 2. Job Board

**What it does:** Browse and filter verified public job listings. Shows a skill match percentage for signed-in users.

**How it works:** The backend queries only `verified=True, is_personal=False` jobs, with optional filters for location (SQL `ILIKE`), category (exact match), and skill (Python-side substring filter over the `skills_required` JSON array). The frontend computes a skill match percentage by comparing the user's profile skills against each job's `skills_required` array, displayed as a badge on `JobCard`.

**Key files:**
- `frontend/app/jobs/page.tsx` — Job listing page with All / Long Term / Short Term filter tabs
- `frontend/components/JobCard.tsx` — Job card with Short Term badge and skill match pill
- `frontend/lib/api.ts` — `getJobs()` — `GET /api/jobs` with filter params
- `backend/routes/jobs.py` — `GET /api/jobs` list endpoint with filters and pagination
- `backend/models/job.py` — Job ORM model

---

## 3. Job Detail Page

**What it does:** Shows full job info and provides access to all AI tools for that job.

**How it works:** Fetches the job by UUID. The `GET /api/jobs/{job_id}` endpoint returns any job (public or personal) by ID — the `is_personal` filter was intentionally removed so tracker jobs can also use AI tools. AI tool sections (skills gap, interview prep, etc.) are rendered as expandable panels on this page.

**Key files:**
- `frontend/app/jobs/[id]/page.tsx` — Job detail page with embedded AI tool panels
- `backend/routes/jobs.py` — `GET /api/jobs/{job_id}` (no personal filter)

---

## 4. Post a Job

**What it does:** Lets business users create public job listings.

**How it works:** Requires a valid Clerk JWT and an active business registration. The job is auto-verified (`verified=True`) for hackathon purposes. Fields include title, description, location, salary range, skills, application link, and category (Long Term / Short Term).

**Key files:**
- `frontend/app/jobs/post/page.tsx` — Job creation form with category toggle and application link field
- `backend/routes/jobs.py` — `POST /api/jobs` (requires business account)
- `backend/schemas.py` — `JobCreate` schema with category validator

---

## 5. Job Tracker (Personal)

**What it does:** Track jobs from any source — not just the board. Maintains a Kanban-style status pipeline per job: Saved → Applied → Interview → Offer → Rejected.

**How it works:** Personal jobs are stored in the same `jobs` table with `is_personal=True` and scoped to the user's `clerk_user_id`. Status updates hit `PATCH /api/jobs/personal/{id}/status`. The "AI Tools →" button navigates to the public job detail page (`/jobs/{id}`), which works because `get_job` no longer filters out personal jobs.

**Key files:**
- `frontend/app/jobs/tracked/page.tsx` — Tracker UI with add form, status dropdown, and AI Tools button
- `backend/routes/jobs.py` — `GET/POST /api/jobs/personal`, `PATCH /api/jobs/personal/{id}/status`, `DELETE /api/jobs/personal/{id}`
- `backend/schemas.py` — `JobStatusUpdate` schema (validates status values)

---

## 6. Business Registration & Management

**What it does:** Register a business account (required to post jobs). Manage, edit, and delete posted jobs from a dashboard.

**How it works:** One business per Clerk user (upsert pattern). If the provided `business_number` starts with 9 digits matching the Canadian Business Number format, `verified` is set to `True`. The management dashboard fetches the business's jobs via `GET /api/businesses/me/jobs` and allows inline editing and deletion.

**Key files:**
- `frontend/app/business/register/page.tsx` — Business registration form
- `frontend/app/business/manage/page.tsx` — Dashboard with inline edit/delete and add form
- `backend/routes/businesses.py` — `POST /api/businesses`, `GET /api/businesses/me`, `GET /api/businesses/me/jobs`
- `backend/models/business.py` — Business ORM model

---

## 7. AI Career Counselor

**What it does:** Generates a personalised career roadmap, matching job recommendations, and board/resource suggestions based on the user's profile.

**How it works:** Claude (`claude-sonnet-4-6`) is prompted with the user's full profile (skills, experience, education, target roles) and a set of matching public jobs. It returns a structured JSON object with `roadmap` steps, `current_matches` (job IDs), and `board_recommendations`. Results are cached in `localStorage` keyed by Clerk user ID. Links in the output are rendered as clickable pill buttons via `renderWithLinks()` in `CounselorResult`. A streaming SSE variant is also available.

**Key files:**
- `frontend/app/counsel/page.tsx` — Counselor page with profile summary, cache controls, and result display
- `frontend/components/CounselorResult.tsx` — Roadmap timeline, matching jobs grid, recommendations list, link pill renderer
- `backend/routes/counsel.py` — `POST /api/counsel` and `POST /api/counsel/stream`
- `backend/services/claude_service.py` — `get_career_counsel()`, `stream_career_counsel()`

---

## 8. Skills Gap Analysis

**What it does:** Compares the user's profile skills against a specific job's required skills. Identifies gaps and recommends how to close them.

**How it works:** Claude receives the user's skills list and the job's `skills_required` array, then returns `missing_skills`, `matching_skills`, a prose `gap_analysis`, and concrete `recommendations`. Requires authentication and a saved profile. Responds in the user's `preferred_language`.

**Key files:**
- `frontend/app/jobs/[id]/page.tsx` — "Skills Gap" expandable panel
- `backend/routes/jobs.py` — `POST /api/jobs/{job_id}/skills-gap`
- `backend/services/claude_service.py` — `analyze_skills_gap()`

---

## 9. Interview Prep

**What it does:** Generates tailored interview questions and answer frameworks for a specific job, personalised to the user's background.

**How it works:** Claude is prompted with the job description and the user's profile, and returns a list of `InterviewQuestion` objects each with a `question` and `answer_framework`. Requires authentication and a profile.

**Key files:**
- `frontend/app/jobs/[id]/page.tsx` — "Interview Prep" expandable panel
- `backend/routes/jobs.py` — `POST /api/jobs/{job_id}/interview-prep`
- `backend/services/claude_service.py` — `generate_interview_prep()`

---

## 10. Jargon Translator

**What it does:** Translates confusing workplace jargon and technical terms in a job description into plain language, with a glossary.

**How it works:** Public endpoint (no auth required). Claude receives the job description and returns the `translated` version plus a `glossary` array of `{term, explanation}` pairs. Language defaults to English but can be overridden.

**Key files:**
- `frontend/app/jobs/[id]/page.tsx` — "Translate Jargon" expandable panel
- `backend/routes/jobs.py` — `POST /api/jobs/{job_id}/translate`
- `backend/services/claude_service.py` — `translate_jargon()`

---

## 11. First-Week Cultural Prep

**What it does:** Provides practical cultural onboarding tips for an immigrant starting a new Canadian job — covering workplace norms, communication styles, hierarchy, and etiquette.

**How it works:** Claude is prompted with the job title, company context, and the user's background, then returns a `tips` array of actionable advice. Requires authentication; profile is optional (language preference is used if available).

**Key files:**
- `frontend/app/jobs/[id]/page.tsx` — "First Week Prep" expandable panel
- `backend/routes/jobs.py` — `POST /api/jobs/{job_id}/first-week-prep`
- `backend/services/claude_service.py` — `get_first_week_prep()`

---

## 12. Cold Outreach Email Generator

**What it does:** Writes a professional cold outreach email for any job — even ones not on the board. Highlights the user's relevant skills and asks if the company is hiring.

**How it works:** The user pastes a job title, description, and optionally a company name. Claude is prompted with the user's profile and generates an email `subject` and `body`. The prompt explicitly instructs Claude this is cold outreach — not a response to an existing posting.

**Key files:**
- `frontend/app/outreach/page.tsx` — Outreach email page (paste any job, generate email)
- `backend/routes/jobs.py` — `POST /api/jobs/{job_id}/outreach` (job-specific variant)
- `backend/routes/outreach.py` — `POST /api/outreach` (free-form variant)
- `backend/services/claude_service.py` — `generate_outreach_message()`

---

## 13. Resume Import (PDF Parsing)

**What it does:** Upload a PDF resume; Claude extracts and parses it into structured profile data that auto-populates the user's profile.

**How it works:** The backend receives the PDF file, uses `pypdf` to extract raw text, then sends it to Claude with a prompt to return structured JSON: `skills[]`, `education[]`, `certifications[]`, `experience[]`, `target_roles[]`. The extracted data is upserted into the user's `Profile` row.

**Key files:**
- `frontend/app/resume/page.tsx` — Import tab with drag-and-drop PDF upload
- `backend/routes/resume.py` — `POST /api/resume/import`
- `backend/services/claude_service.py` — `parse_resume()`

---

## 14. Resume Generator (PDF)

**What it does:** Generates a polished PDF resume from the user's profile using a professional LaTeX template.

**How it works:** The backend fetches the user's full name and email from Clerk's backend API (`GET /v1/users/{id}` with `CLERK_SECRET_KEY`). It then builds a LaTeX document using Jake's resume template, populating sections for skills, experience, education, and certifications. The LaTeX is compiled to PDF using the `tectonic` binary (bundled in the repo) and returned as a binary download.

**Key files:**
- `frontend/app/resume/page.tsx` — Generate tab with download button
- `backend/routes/resume.py` — `GET /api/resume/generate`, `_get_clerk_user_info()`, `_build_latex()`
- `backend/tectonic` — Bundled LaTeX compiler binary

---

## 15. Cover Letter Generator

**What it does:** Writes a tailored cover letter for a specific job using the user's profile.

**How it works:** Claude receives the job description and user profile and writes a cover letter. A streaming SSE variant (`/stream`) delivers the letter word-by-word in real time. The frontend listens for `data: [DONE]` to detect completion.

**Key files:**
- `frontend/app/cover-letter/[jobId]/page.tsx` — Standalone cover letter page
- `frontend/app/jobs/[id]/page.tsx` — Embedded cover letter panel on job detail
- `backend/routes/resume.py` — `POST /api/resume/cover-letter`, `POST /api/resume/cover-letter/stream`
- `backend/services/claude_service.py` — `generate_cover_letter()`, `stream_cover_letter()`

---

## 16. Salary Insights

**What it does:** Estimates a salary range for a given role, location, and skill set in the Canadian market.

**How it works:** Public endpoint. Claude is prompted with role, location, and skills and returns `estimated_min`, `estimated_max`, `median` (annual CAD), and a short contextual `notes` string.

**Key files:**
- `backend/routes/insights.py` — `POST /api/insights/salary`
- `backend/services/claude_service.py` — `get_salary_insight()`
- `backend/schemas.py` — `SalaryInsightRequest`, `SalaryInsightResponse`

---

## 17. Canadian Workplace Culture Quiz

**What it does:** Interactive multiple-choice quiz on Canadian workplace norms. Tracks a correct-answer streak.

**How it works:** Claude generates a question in a chosen category (email etiquette, meeting norms, dress code, jargon, hierarchy, punctuality) with 4 options. A second Claude call evaluates the selected answer, returns `correct` (bool), the `correct_answer`, and a `feedback` explanation. Streak is stored client-side in `localStorage`.

**Key files:**
- `frontend/app/quiz/page.tsx` — Quiz UI with category selector, question display, and streak counter
- `backend/routes/quiz.py` — `POST /api/quiz/question`, `POST /api/quiz/evaluate`
- `backend/services/claude_service.py` — `generate_quiz_question()`, `evaluate_quiz_answer()`

---

## 18. Know Your Rights

**What it does:** Educational reference on Canadian employment rights — rest breaks, discrimination protections, unsafe work refusal, notice periods, and more. Includes province-specific minimum wage lookup.

**How it works:** Entirely static frontend content. Seven collapsible accordion cards cover key rights. A province selector shows the current minimum wage (hardcoded as of March 2026 for all 13 provinces/territories). Links to provincial employment standards offices and legal aid resources are included. The paycheck explainer is also embedded on this page.

**Key files:**
- `frontend/app/rights/page.tsx` — Full rights page with accordion cards and minimum wage selector

---

## 19. Paycheck Explainer

**What it does:** Breaks down an annual salary into estimated deductions (CPP, EI, federal tax, provincial tax) and shows estimated net pay for a given Canadian province.

**How it works:** Claude is prompted with the salary and province and returns a `deductions[]` array (name, amount, explanation) and a `plain_summary`. The salary input is validated server-side (must be finite, positive, under $10M).

**Key files:**
- `frontend/app/paycheck/page.tsx` — Standalone paycheck calculator page
- `frontend/app/rights/page.tsx` — Embedded paycheck calculator widget
- `backend/routes/paycheck.py` — `POST /api/paycheck/explain`
- `backend/services/claude_service.py` — `explain_paycheck()`
- `backend/schemas.py` — `PaycheckRequest` (with salary validator), `PaycheckExplanation`

---

## 20. User Profile Management

**What it does:** Create and edit a career profile: skills, target roles, certifications, education, work experience, preferred language, and province.

**How it works:** A single `PUT /api/profile` endpoint upserts the profile row. The frontend shows a profile completeness score (0–5 based on filled sections). Arrays (skills, certs, target roles) use comma-separated input. Education and experience are structured entries with add/remove controls. `preferred_language` drives all AI response languages; `province` pre-fills paycheck and rights tools.

**Key files:**
- `frontend/app/profile/page.tsx` — Profile editor with completeness indicator
- `backend/routes/profile.py` — `GET /api/profile`, `PUT /api/profile`
- `backend/models/profile.py` — Profile ORM model (JSON columns for education/experience)
- `backend/schemas.py` — `ProfileCreate`, `ProfileOut`

---

## 21. Internationalisation (i18n)

**What it does:** Full UI translation across 8 languages. All AI features respond in the user's chosen language.

**How it works:** A React Context (`LanguageContext`) wraps the app and provides a `t` translation object. The current language is persisted in `localStorage`. All 8 language string sets are defined in `translations.ts`. On the backend, every Claude prompt receives a language prefix (e.g. `"Respond in Hindi."`) so AI output matches the user's preference. The user's `preferred_language` profile field keeps the language setting in sync.

**Supported languages:** English, French, Spanish, Hindi, Tagalog, Punjabi, Mandarin (Simplified), Korean

**Key files:**
- `frontend/contexts/LanguageContext.tsx` — Context provider with `useLanguage()` hook
- `frontend/lib/translations.ts` — All translated UI strings for all 8 languages
- `backend/services/claude_service.py` — Language param passed as prompt prefix to every Claude call

---

## 22. Dark Mode

**What it does:** Toggle between light and dark themes, persisted across sessions.

**How it works:** Clicking the toggle in the navbar adds/removes the `.dark` class on the `<html>` element. Tailwind's `darkMode: 'class'` config activates dark variants. Custom CSS variables in `globals.css` define the dark palette (deep navy backgrounds, muted brand colours). The preference is saved in `localStorage`.

**Key files:**
- `frontend/components/ThemeToggle.tsx` — Sun/moon icon toggle button
- `frontend/app/globals.css` — `.dark` CSS variable overrides for the brand palette
- `frontend/tailwind.config.ts` — `darkMode: 'class'`

---

## 23. Streaming AI Responses (SSE)

**What it does:** Delivers AI-generated cover letters and career counselor output in real time, word by word.

**How it works:** FastAPI `StreamingResponse` wraps an `AsyncGenerator` that yields Claude stream chunks using the Anthropic SDK's streaming API. Each chunk is formatted as `data: {text}\n\n`. The stream ends with `data: [DONE]\n\n`. The frontend uses `fetch()` with a `ReadableStream` reader to process chunks incrementally and append them to state.

**Key files:**
- `backend/routes/counsel.py` — `POST /api/counsel/stream`
- `backend/routes/resume.py` — `POST /api/resume/cover-letter/stream`
- `backend/services/claude_service.py` — `stream_career_counsel()`, `stream_cover_letter()`
- `frontend/app/counsel/page.tsx` — SSE consumer for counselor stream
- `frontend/app/cover-letter/[jobId]/page.tsx` — SSE consumer for cover letter stream

---

## External Dependencies Summary

| Dependency | Purpose |
|---|---|
| **Clerk** | Authentication, JWT validation, user metadata (role) |
| **Anthropic Claude API** (`claude-sonnet-4-6`) | All AI features (counsel, skills gap, interview prep, jargon, outreach, quiz, resume parse, cover letter, paycheck, salary, first-week prep) |
| **Neon (PostgreSQL)** | Primary database via SQLAlchemy ORM |
| **pypdf** | Extract text from uploaded PDF resumes |
| **tectonic** | Compile LaTeX → PDF for resume generation |
| **Next.js 14** | Frontend framework (App Router) |
| **Tailwind CSS** | Styling and dark mode |
| **FastAPI** | Backend API framework |
| **SQLAlchemy** | ORM for PostgreSQL |
| **Pydantic** | Request/response validation and serialisation |
| **httpx** | Backend HTTP client (Clerk API calls) |
