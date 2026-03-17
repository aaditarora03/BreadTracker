@echo off

start "FastAPI Server" powershell -NoExit -Command "cd 'C:\Users\steve\caps\server'; if (!(Test-Path '.venv')) { python -m venv .venv }; & .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; if (!(Test-Path '.env') -and (Test-Path '.env.example')) { Copy-Item '.env.example' '.env' }; uvicorn main:app --reload"

REM --- Start Client ---
start "Next Client" powershell -NoExit -Command ^
"cd C:\Users\steve\caps\web-client; ^
pnpm install; ^
Copy-Item .env.example .env -ErrorAction SilentlyContinue; ^
pnpm run dev"