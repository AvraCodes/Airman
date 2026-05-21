# Airman — Skynet Flight Operations Module

**Production-style fullstack monorepo for aviation training and sortie management.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI · Python 3.12 · SQLAlchemy 2 · Alembic · Pydantic v2 |
| Auth | JWT (python-jose) · bcrypt (passlib) · RBAC via FastAPI Depends |
| Database | PostgreSQL 16 · psycopg3 |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS v3 |
| State | TanStack Query (React Query) · Axios |
| Routing | React Router v7 |
| Infrastructure | Docker · Docker Compose · nginx |

---

## Project Structure

```
airman/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # FastAPI route handlers (auth, sorties, aircraft…)
│   │   ├── core/              # config, security, hashing, token utilities
│   │   ├── db/                # SQLAlchemy models, database session, seed data
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   └── services/          # Shared service helpers (audit, sortie, aircraft)
│   ├── alembic/               # Alembic migrations
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios API modules (auth, sorties, aircraft…)
│   │   ├── components/        # ProtectedRoute, RoleBadge, StatusBadge
│   │   ├── hooks/             # useAuth (JWT persistence + RBAC helper)
│   │   ├── pages/             # Dashboard, SortieBoard, SortieDetail, Training…
│   │   └── types/             # TypeScript interfaces for all 7 models
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   └── api.md                 # API reference
├── docker-compose.yml
└── .env.example
```

---

## Quick Start (Local Dev)

### 1. Backend

```bash
cd backend

# Create venv and install dependencies
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Copy and configure environment
cp ../.env.example .env      # edit DATABASE_URL if needed

# Run (auto-seeds demo data on first start)
uvicorn app.main:app --reload
```

API available at: http://localhost:8000  
Swagger UI: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env         # VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

App available at: http://localhost:5173

---

## Docker (Full Stack)

```bash
cp .env.example .env         # edit SECRET_KEY at minimum
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

---

## Database Migrations (Alembic)

```bash
cd backend

# Run all pending migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "your change description"

# Roll back one migration
alembic downgrade -1
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@airman.local | `admin` |
| Dispatcher | dispatcher@airman.local | `dispatcher` |
| Instructor | instructor@airman.local | `instructor` |
| CFI | cfi@airman.local | `cfi` |
| Cadet | cadet@airman.local | `cadet` |
| Maintenance Officer | mo@airman.local | `mo` |

---

## RBAC Summary

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access to all endpoints |
| **DISPATCHER** | Create/manage sorties, release/airborne/land/cancel/close, report defects, view audit |
| **INSTRUCTOR** | Create and submit training progress for assigned sorties |
| **CFI** | Approve or reject submitted training records, close sorties |
| **CADET** | View own sorties and approved training records only |
| **MAINTENANCE_OFFICER** | Report and resolve aircraft defects, update aircraft status |

---

## Sortie Lifecycle

```
SCHEDULED → RELEASED → AIRBORNE → LANDED → TRAINING_SUBMITTED → TRAINING_APPROVED → CLOSED
                                  ↓
                          RECOVERY_REQUIRED (on defect reported mid-sortie)
              ↓
           CANCELLED (from SCHEDULED or RELEASED)
```

---

## Environment Variables

See [.env.example](.env.example) for a full reference.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing key (generate with `openssl rand -hex 32`)
- `ACCESS_TOKEN_EXPIRE_MINUTES` — Token TTL (default: 480 = 8h)
- `VITE_API_BASE_URL` — Backend URL for the React app
