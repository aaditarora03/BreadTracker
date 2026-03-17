from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.subscription_api import router as subs_router
from routes.auth_api import router as auth_router
from services.email_service import send_email
from fastapi import Depends
from services.get_user import get_user
from pydantic import BaseModel

class EmailRequest(BaseModel):
    service_name: str
    cost: float



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



@app.post("/send-test-email")
async def send_test_email(data: EmailRequest, user= Depends(get_user)):
    ##sub =Depends(get_)
    send_email(
        user.email,
        "Subscription Email",
        f"You have signed up for {data.service_name} for ${data.cost:.2f} a month."
    )
    return {"status": "Email sent"}