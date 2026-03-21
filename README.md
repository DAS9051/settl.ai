# settl.ai

AI-powered career counselor + local business job board. Hackathon project.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL on Neon (SQLAlchemy + Alembic) |
| Auth | Clerk (JWT, business role via metadata) |
| AI | Claude API (`claude-sonnet-4-6`) |
| PDF | tectonic (LaTeX → PDF), pypdf (PDF text extraction) |

## Features

- **Job Board** — browse, filter, and post local job listings
- **AI Career Counselor** — Claude analyzes your profile against live job listings and returns a roadmap, matched jobs, and recommendations
- **Skills Gap Analysis** — per-job analysis of what you're missing and how to close the gap
- **Salary Insights** — Claude estimates salary ranges for any role + location + skills combo
- **Resume Import** — upload a PDF resume; Claude extracts and populates your profile automatically
- **Resume Generator** — generates a Jake's LaTeX template PDF from your profile via tectonic
- **Cover Letter Generator** — Claude writes a tailored cover letter for any job posting
- **Dark Mode** — toggleable, persisted to localStorage, custom deep-navy palette

## Project Structure

```
HTGProject/
├── backend/
│   ├── main.py               # FastAPI app, CORS, router registration
│   ├── database.py           # SQLAlchemy engine + session
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── job.py
│   │   ├── profile.py
│   │   └── business.py
│   ├── routes/               # FastAPI routers
│   │   ├── jobs.py           # GET/POST /api/jobs, skills-gap
│   │   ├── profile.py        # GET/PUT /api/profile
│   │   ├── businesses.py     # POST /api/businesses
│   │   ├── counsel.py        # POST /api/counsel
│   │   ├── insights.py       # POST /api/insights/salary
│   │   └── resume.py         # import, generate (PDF), cover-letter
│   ├── services/
│   │   ├── auth.py           # Clerk JWT verification
│   │   └── claude_service.py # All Claude API calls
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── tectonic              # Self-contained LaTeX compiler binary (Linux x86-64)
│   ├── requirements.txt
│   └── .env                  # Secrets (not committed)
└── frontend/
    ├── app/
    │   ├── layout.tsx         # Root layout: Inter font, nav, Clerk provider
    │   ├── globals.css        # Tailwind base + dark mode CSS variables
    │   ├── page.tsx           # Landing / home
    │   ├── jobs/
    │   │   ├── page.tsx       # Job board listing + filters
    │   │   ├── [id]/page.tsx  # Job detail + skills gap + cover letter
    │   │   └── post/page.tsx  # Post a job (business only)
    │   ├── profile/page.tsx   # Edit profile
    │   ├── counsel/page.tsx   # AI career counselor
    │   ├── resume/page.tsx    # Resume import + generate
    │   └── salary/page.tsx    # Salary insights
    ├── components/
    │   └── ThemeToggle.tsx    # Sun/moon toggle, persists to localStorage
    ├── lib/
    │   ├── api.ts             # All fetch wrappers to backend
    │   └── types.ts           # Shared TypeScript types
    ├── tailwind.config.ts
    └── .env.local             # Frontend env vars (not committed)
```

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ (on Windows, runs via `cmd.exe` from WSL)
- PostgreSQL connection string (Neon)

### Backend

```bash
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### Frontend (from WSL on Windows)

```bash
cmd.exe /c "cd C:\Users\Dylan\Desktop\school and coding\hackathon\HTGProject\frontend && npm run dev"
```

Or natively on Mac:

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
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Implementation Notes

- **tectonic binary** lives at `backend/tectonic` (Linux x86-64). On Mac you'll need to download the macOS ARM/x86 build from [tectonic-typesetting/tectonic releases](https://github.com/tectonic-typesetting/tectonic/releases).
- **Clerk JWKS URL** is derived from the publishable key: `saving-gull-89.clerk.accounts.dev/.well-known/jwks.json`
- **Business accounts** are identified by `role: "business"` in Clerk public metadata — set this manually in the Clerk dashboard for business users
- **Dark mode** uses the `.dark` class on `<html>` with CSS variables (`--dm-bg: #0F0E47`, `--dm-surface: #272757`, etc.)
