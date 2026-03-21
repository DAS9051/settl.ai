# HTG Hackathon - Implementation Todo

## Stack
- Frontend: Next.js (TypeScript) → Vercel
- Backend: FastAPI (Python) → Railway/Render
- DB: PostgreSQL on Neon (SQLAlchemy + Alembic)
- Auth: Clerk (JWT, business role via metadata)
- AI: Claude API (claude-sonnet-4-6)

---

## Implementation Checklist

### Backend (FastAPI)
- [x] Project scaffold: `backend/` with `requirements.txt`, `main.py`
- [x] Database connection: `database.py` (SQLAlchemy + Neon connection string)
- [x] Models: `Job`, `Profile`, `Business` (Pydantic + SQLAlchemy)
- [x] Alembic migrations setup
- [x] Auth middleware: Clerk JWT verification
- [x] Routes: `GET/POST /api/jobs`
- [x] Routes: `GET/PUT /api/profile`
- [x] Routes: `POST /api/businesses`
- [x] Routes: `POST /api/counsel`
- [x] Claude service: structured prompt + JSON response

### Frontend (Next.js)
- [x] Project scaffold: `frontend/` with Next.js App Router + TypeScript
- [x] Clerk provider in root layout
- [x] Auth pages: sign-in, sign-up
- [x] Job board page: list + filter jobs
- [x] Job post form (business role only)
- [x] Profile page: skills, education, experience form
- [x] AI Counselor page: form → results (roadmap + matches)
- [x] API client lib (`lib/api.ts`)

### Config / Env
- [x] `backend/.env.example`
- [x] `frontend/.env.local.example`

---

## Review
_To be filled after implementation_
