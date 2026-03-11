# BreadTracker

BreadTracker is a full-stack app with:
- Backend: FastAPI + SQLModel + Alembic (`server/`)
- Frontend: React + TypeScript + Vite (`web-client/`)

## Prerequisites

- Python 3.10+
- Node.js 18+ (or newer LTS)
- `pnpm` installed globally
- A PostgreSQL database (Supabase Postgres works)
- Supabase project credentials for auth

## 1. Clone

```bash
git clone <your-repo-url>
cd BreadTracker
```

## 2. Backend Setup (`server/`)

```bash
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set values in `server/.env`:

```env
DATABASE_URL=postgresql+psycopg2://<username>:<password>@<host>:<port>/<database>
SUPABASE_PROJECT_URL=https://<project-ref>.supabase.co
SUPABASE_API_KEY=<supabase-anon-or-service-role-key>
```

Run database migrations:

```bash
alembic upgrade head
```

Start backend API:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend health check:
- `http://127.0.0.1:8000/`

## 3. Frontend Setup (`web-client/`)

Open a second terminal:

```bash
cd web-client
pnpm install
cp .env.example .env
pnpm dev
```

The frontend uses this API base by default:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Open app:
- `http://127.0.0.1:5173`


```

## Troubleshooting

- `DATABASE_URL is not configured on the server.`
  - Ensure `server/.env` exists and `DATABASE_URL` is set.
- `Supabase is not configured...`
  - Ensure `SUPABASE_PROJECT_URL` and `SUPABASE_API_KEY` are set.
- Frontend cannot reach API:
  - Confirm backend is running on `127.0.0.1:8000`.
  - Confirm `web-client/.env` has `VITE_API_BASE_URL=http://127.0.0.1:8000/api`.
- `pnpm: command not found`:
  - Install pnpm: `npm i -g pnpm`.
