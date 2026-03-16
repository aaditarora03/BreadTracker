from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.subscription_api import router as subs_router
from routes.auth_api import router as auth_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://[::1]:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://[::1]:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://[::1]:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def root():
    return { 'message': 'BreadTracker API is Online' }

api_router = APIRouter(prefix='/api')

api_router.include_router(subs_router)
api_router.include_router(auth_router)

app.include_router(api_router)