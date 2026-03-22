# settl.ai — Devpost Submission

---

## Inspiration

Canada welcomes over 400,000 new permanent residents every year — yet the journey from arriving to finding stable, meaningful employment is one of the most difficult transitions immigrants face. The barriers are not just about credentials or language. They're about not knowing how to write a Canadian-style resume, not understanding what "synergy" means in a job description, not knowing that showing up exactly on time to an interview is actually considered slightly late in many Canadian workplaces, and not knowing which deductions will come out of your first paycheque.

Existing job platforms like Indeed and LinkedIn were built for people who already understand the system. They assume you know how to navigate workplace culture, how to advocate for your rights, and how to write a cold email to a hiring manager. As immigrants ourselves, we know that for most newcomers none of this is obvious.

We built settl.ai because we believe the problem isn't a lack of opportunity — it's a lack of context. Our goal was to build a single platform that doesn't just show immigrants job listings, but actively guides them through every step of the employment journey: finding roles, understanding them, preparing for interviews, knowing their rights, and feeling confident walking in on day one.

---

## What Does Our Solution Do?

settl.ai is an AI-powered Canadian career platform designed specifically for newcomers. It combines a curated job board with a suite of AI tools that address the unique challenges immigrants face at every stage of the job search.

### Core Features

**Job Board & Tracker**
Users can browse verified local job listings filtered by skill, location, and job type (long-term vs. short-term contract). They can also add any job from the internet to their personal tracker — even jobs posted on external sites — and manage their application pipeline through statuses: Saved → Applied → Interview → Offer → Rejected. Every job in the tracker gets full access to all AI tools.

**AI Career Counselor**
Claude analyzes the user's full profile (skills, experience, education, target roles) against the live job board and generates a personalized career roadmap with actionable steps, matching job recommendations, and links to free training resources (Coursera, etc.).

**Skills Gap Analysis**
For any job, Claude compares the user's skills against the job's requirements and returns a breakdown of matching skills, missing skills, a plain-language gap summary, and specific recommendations for bridging the gap.

**Interview Prep**
Claude generates job-specific interview questions with structured answer frameworks, tailored to the user's actual background — so a former teacher applying to a customer service role gets different questions than a software engineer.

**Jargon Translator**
Paste any job description and Claude translates Canadian workplace jargon and acronyms into plain language, with a glossary of key terms. This is a public endpoint — no account required.

**First-Week Cultural Prep**
Claude generates a set of cultural onboarding tips specific to the job and workplace context: how to handle disagreement with a manager, what "casual Friday" actually means, how to interpret feedback that sounds polite but means "please change this."

**Cold Outreach Email Generator**
Users paste any job posting and Claude writes a professional cold outreach email tailored to their profile and the company — not a generic cover letter, but a genuine inquiry asking if the company is hiring.

**Resume Builder**
Users upload a PDF resume and Claude parses it into structured profile data (skills, experience, education). They can then generate a polished PDF resume using a professional LaTeX template compiled server-side, with their real name and email pulled from their account.

**Cover Letter Generator**
Claude writes a tailored cover letter for any specific job, with a streaming real-time delivery option.

**Canadian Workplace Culture Quiz**
An interactive multiple-choice quiz across six categories: email etiquette, meeting norms, dress code, jargon, workplace hierarchy, and punctuality. Claude generates fresh questions and evaluates answers with explanatory feedback. A streak counter encourages repeated learning.

**Know Your Rights**
A reference guide to Canadian employment law — rest breaks, unsafe work refusal, discrimination protections, termination notice, and more — with province-specific minimum wage data and links to provincial employment standards offices and legal aid.

**Paycheck Explainer**
Users enter their salary and province and Claude breaks down estimated deductions (CPP, EI, federal and provincial income tax) and explains each one in plain language, so newcomers aren't surprised by their first paycheque.

### Social Impact

Every feature was designed around a specific barrier immigrants face. The jargon translator addresses language confusion. The cultural prep addresses invisible norms that no job listing mentions. The rights page addresses exploitation risk. The paycheck explainer addresses financial literacy gaps. Together, these tools lower the information asymmetry that puts newcomers at a disadvantage relative to Canadian-born job seekers.

---

## How We Built It

### Stack Overview

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Clerk for authentication
- **Backend:** FastAPI (Python), SQLAlchemy ORM, Pydantic for validation
- **Database:** PostgreSQL hosted on Neon (serverless)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) for all AI features
- **PDF:** `pypdf` for resume text extraction; `tectonic` (bundled LaTeX compiler) for PDF generation

### Architecture

The app is split into a Next.js frontend and a FastAPI backend. The frontend communicates with the backend via a REST API. Clerk handles authentication on both sides: the frontend uses Clerk's React SDK, and the backend validates Bearer JWTs by verifying against Clerk's JWKS endpoint. The `get_current_user_dep` FastAPI dependency extracts the Clerk user ID from any valid token and is injected into every protected route.

The database uses three core models: `Job` (handles both public business postings and personal tracked jobs via an `is_personal` flag), `Profile` (stores structured career data with JSON columns for education and experience arrays), and `Business` (one per Clerk user, required to post jobs).

### AI Integration

All AI features are implemented in `backend/services/claude_service.py`. Each function constructs a structured prompt combining user profile data, job details, and a language prefix (e.g. `"Respond in Hindi."`) so responses are delivered in the user's preferred language. Claude returns structured JSON in every case, parsed directly into Pydantic response models.

For the career counselor and cover letter features, we implemented Server-Sent Events (SSE) streaming: FastAPI returns a `StreamingResponse` wrapping an `AsyncGenerator` that yields Claude stream chunks. The frontend reads these incrementally via the Fetch API's `ReadableStream`, appending tokens to state as they arrive.

### Key Implementation Details

- **Personal job tracker + AI tools:** All jobs (public and personal) share the same `jobs` table. Personal jobs have `is_personal=True` and are scoped by `clerk_user_id`. The public `GET /api/jobs/{id}` endpoint intentionally returns any job regardless of `is_personal`, so users can navigate from their tracker directly to the job detail page and use all AI tools.
- **Resume PDF generation:** The backend calls Clerk's backend API (`GET /v1/users/{id}`) to fetch the user's real name and email at generation time, then builds a LaTeX document and compiles it with the bundled `tectonic` binary.
- **Multilingual AI:** Every Claude prompt prepends a language instruction. The user's `preferred_language` profile field is passed to every AI endpoint so responses are automatically in the right language across all 8 supported languages.
- **Result caching:** Career counselor results are cached in `localStorage` keyed by Clerk user ID to avoid unnecessary API calls on page reload.

### Validation Testing

We tested each AI endpoint by comparing outputs against known good examples:

- **Skills gap:** Seeded test profiles with known skill sets and verified that `matching_skills` and `missing_skills` were correctly partitioned relative to job requirements.
- **Jargon translator:** Tested with job descriptions containing dense corporate jargon (e.g. "leverage synergies", "own the roadmap") and verified that the glossary contained each flagged term.
- **Paycheck explainer:** Cross-referenced Claude's deduction estimates against the CRA's online payroll deductions calculator for several salary/province combinations. Results were within acceptable range for a general estimate.
- **Resume parsing:** Uploaded resumes with varying formats and verified that extracted skills, education, and experience populated correctly in the profile.
- **End-to-end tracker → AI tools:** Confirmed that personal jobs added to the tracker successfully load on the job detail page and return results from all AI endpoints.

---

## Challenges We Faced

**Connecting personal tracker jobs to AI tools**
Initially the `GET /api/jobs/{id}` endpoint filtered out personal jobs (`is_personal=False`), so when users clicked "AI Tools" from their tracker, the job returned a 404. The fix required understanding that both public and personal jobs need to be accessible by UUID on the detail page — we removed the personal filter from the get-by-ID endpoint while keeping it on the public listing endpoint.

**Resume PDF generation with correct user name**
The resume builder was generating PDFs with "Your Name" as a placeholder because the backend had no way to know the user's display name — Clerk's JWT only contains a user ID. We solved this by adding a server-side call to Clerk's backend API using `CLERK_SECRET_KEY` to fetch `first_name`, `last_name`, and `email_addresses` at generation time.

**Database connectivity on restricted networks**
Neon's PostgreSQL runs on port 5432, which is blocked on some public and institutional WiFi networks. During development this caused seemingly random "Failed to fetch" errors that looked like application bugs. The fix was switching to a hotspot or a network that allows outbound connections on port 5432 — not a code issue, but diagnosing it cost significant time.

**Structured JSON from Claude**
Getting Claude to return consistent, parseable JSON across all AI features required careful prompt engineering. Early prompts occasionally returned JSON wrapped in markdown code fences or with extra commentary. We resolved this by explicitly instructing Claude to return only raw JSON with no preamble, and by validating against Pydantic schemas that throw clear errors when the structure doesn't match.

**LaTeX escaping for special characters**
User profile data often contains characters that break LaTeX compilation (`&`, `%`, `#`, `$`, `_`, etc.). We had to implement a thorough LaTeX escape function applied to all user-provided strings before template injection to prevent compilation failures.

---

## Accomplishments We're Proud Of

- **Full-stack AI integration at hackathon speed.** We built 12+ distinct AI-powered features — each with its own prompt, schema, and UI — in a single hackathon weekend, all working end-to-end.
- **Multilingual support across every AI feature.** Every Claude call respects the user's preferred language. A user who sets their language to Tagalog gets interview questions, a career roadmap, and cultural tips all in Tagalog — without any translation layer, just prompt engineering.
- **PDF resume generation from scratch.** Compiling LaTeX server-side with a bundled `tectonic` binary, fetching the user's real name from Clerk's API, and streaming the result as a download is a genuinely complex pipeline that we got working cleanly.
- **Personal job tracker that works with all AI tools.** The insight that personal tracker jobs and public board jobs can share the same database table and the same AI endpoints — unified by a UUID — made the architecture much simpler and more powerful than treating them as separate systems.
- **8-language support.** Supporting English, French, Spanish, Hindi, Tagalog, Punjabi, Mandarin, and Korean without a translation service — just Claude and a `preferred_language` field — meant no additional infrastructure cost and perfectly fluent responses in each language.

---

## What We Learned

- **Prompt engineering is product design.** The quality of AI outputs is almost entirely determined by prompt structure. Spending time on the exact wording of each prompt — especially the JSON schema instructions and language prefix — had more impact on output quality than any architectural decision.
- **Shared data models reduce complexity.** Using a single `jobs` table with an `is_personal` flag instead of separate tables for tracked vs. board jobs simplified every query, every API endpoint, and every frontend component.
- **Clerk is powerful but has sharp edges.** The JWT validation and role metadata system are excellent. But getting the user's display name for server-side operations (like PDF generation) requires a separate backend API call — something that isn't immediately obvious from the docs.
- **SSE streaming noticeably improves perceived performance.** Even when total generation time is similar, streaming text character-by-character feels faster and more responsive than waiting for a full response. It meaningfully changes how the feature feels to use.

---

## What's Next?

### Short-Term Improvements (1–2 weeks)

- **Job application link validation:** Currently the application link field is a free-text URL with no validation beyond schema type. Adding URL format validation and a "test this link" check would prevent dead links in postings.
- **Profile photo and identity verification for businesses:** Right now any user can register a business with any name. Adding a verification step (e.g. confirming a Canada Revenue Agency Business Number via an external API) would improve listing quality.
- **Saved AI results per job:** Interview prep and skills gap results are regenerated each time. Caching them per job ID in the database (similar to how the counselor caches in localStorage) would save API costs and let users refer back to results.
- **Mobile-responsive layout improvements:** The current UI is desktop-first. Polishing the tracker, job detail, and profile pages for mobile would significantly expand accessibility.

### Long-Term Scalability

- **Replacing auto-verification with a moderation queue:** For a production deployment, job postings would need human or automated review before going live. Auto-verification was a hackathon shortcut that would need to be replaced with a proper moderation workflow.
- **Vector search for job matching:** The current job board uses substring filtering for skills. A production system would benefit from embedding-based semantic search (e.g. pgvector on Neon) so "customer service" matches "client-facing communication" without exact string overlap.
- **Credential recognition integration:** A major barrier for skilled immigrants is foreign credential recognition. Integrating with provincial regulatory bodies' APIs or databases to surface credential assessment pathways directly within the career counselor would address a critical unmet need.
- **Community features:** A peer mentorship layer — connecting recent immigrants who have successfully navigated the job market in a specific field with those who are just starting — would complement the AI tools with human context. This could be built as a simple messaging layer on top of the existing profile system.
- **Partnership with settlement agencies:** Organizations like ACCES Employment and COSTI already serve immigrant job seekers. An API integration or white-label version of settl.ai that plugs into their existing workflows would dramatically increase reach without requiring users to discover the platform independently.
