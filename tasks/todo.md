# settl.ai — Task Tracker

## Stack
- Frontend: Next.js 14 (App Router, TypeScript) → Vercel
- Backend: FastAPI (Python) → Railway/Render
- DB: PostgreSQL on Neon (SQLAlchemy + Alembic)
- Auth: Clerk (JWT, business role via metadata)
- AI: Claude API (claude-sonnet-4-6)

---

## Completed Features

### Backend
- [x] Project scaffold with `requirements.txt`, `main.py`
- [x] Database connection via SQLAlchemy + Neon
- [x] ORM models: `Job`, `Profile`, `Business`
- [x] Alembic migrations
- [x] Clerk JWT auth middleware (`services/auth.py`)
- [x] `GET/POST /api/jobs` — job board CRUD
- [x] `GET /api/jobs/{id}` — single job detail
- [x] `POST /api/jobs/{id}/skills-gap` — Claude skills gap analysis
- [x] `GET/PUT /api/profile` — user profile
- [x] `POST /api/businesses` — business registration
- [x] `POST /api/counsel` — Claude career counselor
- [x] `POST /api/insights/salary` — Claude salary estimator
- [x] `POST /api/resume/import` — PDF upload → pypdf → Claude parse → profile upsert
- [x] `GET /api/resume/generate` — Jake's LaTeX template → tectonic → PDF response
- [x] `POST /api/resume/cover-letter` — Claude cover letter generation
- [x] `business_name` populated on JobOut via join query

### Frontend
- [x] Next.js App Router scaffold + TypeScript
- [x] Clerk provider + auth pages (sign-in, sign-up)
- [x] Job board: listing + skill/location filters
- [x] Job detail page: description, skills gap, cover letter
- [x] Post a job form (business role gate)
- [x] Profile editor: skills, education, experience, certifications
- [x] AI Counselor page: roadmap + matched jobs + recommendations
- [x] Resume page: PDF upload import + PDF generate/download
- [x] Salary insights page
- [x] Dark mode with deep-navy palette (#0F0E47, #272757, #505081, #8686AC)
- [x] ThemeToggle component (persisted to localStorage)
- [x] Inter font via `next/font/google`
- [x] Frosted glass navbar

---

## Outstanding / Nice-to-Have

### High Priority
- [ ] **Mac tectonic binary** — replace `backend/tectonic` with macOS ARM build for local dev on Mac
  - Download from: https://github.com/tectonic-typesetting/tectonic/releases
  - File: `tectonic-v0.x.x-aarch64-apple-darwin.tar.gz` (Apple Silicon) or `x86_64-apple-darwin`
  - Place at `backend/tectonic` and `chmod +x backend/tectonic`
- [ ] **Deployment** — push to Vercel (frontend) + Railway or Render (backend)
- [ ] **Business role assignment** — UI or Clerk dashboard flow to grant `role: "business"` metadata

### Polish
- [ ] Loading skeletons on job board
- [ ] Toast notifications for save/error states
- [ ] Job search by keyword (currently only skill + location filters)
- [ ] Pagination on job board (currently returns all)
- [ ] Profile photo / avatar support
- [ ] Mobile responsive audit

### Bugs to Watch
- [ ] If tectonic binary is wrong architecture (e.g., Linux binary on Mac), `/api/resume/generate` returns 500
- [ ] Cover letter generation requires a populated profile — surface a better error if profile is empty
- [ ] Salary insight page has no auth gate — currently public (intentional for hackathon demo)

---

## Session Notes (2026-03-21)

All core features built and tested locally on Windows/WSL. Both servers shut down end of session.

To resume next session:
1. Start backend: `cd backend && python3 -m uvicorn main:app --port 8000`
2. Start frontend: `cd frontend && npm run dev` (Mac native, no cmd.exe needed)
3. Open `http://localhost:3000`
