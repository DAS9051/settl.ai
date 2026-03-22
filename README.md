# settl.ai

AI-powered career platform for newcomers to Canada. Built at Hack The Globe 2026.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL on Neon (SQLAlchemy) |
| Auth | Clerk (JWT, business role via metadata) |
| AI | Claude API (`claude-sonnet-4-6`) |
| PDF | tectonic (LaTeX → PDF), pypdf (PDF text extraction) |

## Features

### Job Board & Tracker
- **Job Board** — browse, filter, and post local job listings (filter by skill, location, long-term / short-term)
- **Job Tracker** — add any job from the internet; track application status (Saved → Applied → Interview → Offer → Rejected)
- **Business Management** — register a business, post jobs, edit and delete listings from a dashboard

### AI Tools
- **AI Career Counselor** — Claude analyzes your profile against live job listings and returns a personalised roadmap, matched jobs, and resource recommendations
- **Skills Gap Analysis** — per-job breakdown of matching/missing skills and how to close the gap
- **Interview Prep** — Claude generates tailored interview questions and answer frameworks for any job
- **Jargon Translator** — translates Canadian workplace jargon in job descriptions into plain language with a glossary
- **First-Week Cultural Prep** — cultural onboarding tips specific to the job (workplace norms, hierarchy, communication)
- **Cold Outreach Email** — generates a professional cold outreach email for any job posting
- **Cover Letter Generator** — Claude writes a tailored cover letter (with SSE streaming)
- **Resume Import** — upload a PDF; Claude parses it and auto-populates your profile
- **Resume Generator** — generates a polished PDF resume from your profile via LaTeX (tectonic)
- **Salary Insights** — Claude estimates salary ranges for any role, location, and skill set

### Education & Rights
- **Canadian Workplace Culture Quiz** — interactive multiple-choice quiz (6 categories) with streak tracking
- **Know Your Rights** — Canadian employment law reference with province-specific minimum wage data
- **Paycheck Explainer** — breaks down gross salary into deductions (CPP, EI, income tax) by province

### Platform
- **Multilingual** — full UI and AI responses in 8 languages: English, French, Spanish, Hindi, Tagalog, Punjabi, Mandarin, Korean
- **Dark Mode** — toggleable, persisted to localStorage, custom deep-navy palette
- **User Profile** — manage skills, experience, education, certifications, target roles, language preference, and province

## Project Structure

```
HTGProject/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, router registration
│   ├── database.py             # SQLAlchemy engine + session
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── models/
│   │   ├── job.py              # Job model (public + personal tracked jobs)
│   │   ├── profile.py          # User career profile
│   │   └── business.py         # Business registration
│   ├── routes/
│   │   ├── jobs.py             # Job board, tracker, and all AI tool endpoints
│   │   ├── profile.py          # GET/PUT /api/profile
│   │   ├── businesses.py       # Business registration + job management
│   │   ├── counsel.py          # AI career counselor (+ SSE stream)
│   │   ├── resume.py           # Import, generate PDF, cover letter (+ SSE stream)
│   │   ├── quiz.py             # Cultural quiz generation + evaluation
│   │   ├── paycheck.py         # Paycheck deduction explainer
│   │   ├── outreach.py         # Cold outreach email generator
│   │   ├── insights.py         # Salary insights
│   │   └── auth.py             # Role management
│   ├── services/
│   │   ├── auth.py             # Clerk JWT verification (JWKS)
│   │   └── claude_service.py   # All Claude API calls
│   ├── tectonic                # Bundled LaTeX compiler binary (Linux x86-64)
│   ├── requirements.txt
│   └── .env                    # Secrets (not committed)
└── frontend/
    ├── app/
    │   ├── layout.tsx           # Root layout: nav, Clerk provider
    │   ├── globals.css          # Tailwind base + dark mode CSS variables
    │   ├── page.tsx             # Landing / home
    │   ├── jobs/
    │   │   ├── page.tsx         # Job board with category/skill/location filters
    │   │   ├── [id]/page.tsx    # Job detail + all AI tool panels
    │   │   ├── post/page.tsx    # Post a job (business only)
    │   │   └── tracked/page.tsx # Personal job tracker
    │   ├── business/
    │   │   ├── register/page.tsx
    │   │   └── manage/page.tsx  # Business job dashboard (edit/delete)
    │   ├── counsel/page.tsx     # AI career counselor
    │   ├── resume/page.tsx      # Resume import + PDF generator
    │   ├── outreach/page.tsx    # Cold outreach email helper
    │   ├── quiz/page.tsx        # Workplace culture quiz
    │   ├── rights/page.tsx      # Know your rights + paycheck explainer
    │   ├── paycheck/page.tsx    # Standalone paycheck calculator
    │   ├── profile/page.tsx     # Profile editor
    │   └── cover-letter/[jobId]/page.tsx
    ├── components/
    │   ├── Nav.tsx              # Navbar with Tools dropdown
    │   ├── JobCard.tsx          # Job card with skill match % and category badge
    │   ├── CounselorResult.tsx  # Career counselor output (roadmap, jobs, recs)
    │   └── ThemeToggle.tsx      # Dark mode toggle
    ├── contexts/
    │   └── LanguageContext.tsx  # i18n provider (8 languages)
    ├── lib/
    │   ├── api.ts               # All fetch wrappers to backend
    │   ├── types.ts             # Shared TypeScript interfaces
    │   └── translations.ts      # All UI strings for all 8 languages
    └── .env.local               # Frontend env vars (not committed)
```

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL connection string (Neon)

### Backend

```bash
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:8000`.

### Environment Variables

**`backend/.env`**
```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGINS=http://localhost:3000
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Implementation Notes

- **tectonic binary** lives at `backend/tectonic` (Linux x86-64). On macOS download the macOS build from [tectonic-typesetting/tectonic releases](https://github.com/tectonic-typesetting/tectonic/releases).
- **Personal job tracker + AI tools** — personal and public jobs share the same `jobs` table. The `GET /api/jobs/{id}` endpoint returns any job by UUID (no `is_personal` filter) so tracker jobs get full access to all AI features.
- **Multilingual AI** — every Claude prompt prepends a language instruction derived from the user's `preferred_language` profile field. No translation layer; Claude responds natively in each language.
- **Resume name** — the PDF generator calls Clerk's backend API (`GET /v1/users/{id}`) with `CLERK_SECRET_KEY` to fetch the user's real name and email at generation time.
- **Business role** — set `role: "business"` in Clerk public metadata to enable job posting. The `/api/auth/role` endpoint handles this via the app's role selection flow.
- **Neon + port 5432** — some public/institutional WiFi blocks outbound connections on port 5432. Switch to a hotspot if you see unexpected database connection errors.
