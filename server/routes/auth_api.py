import os

from models import Profile

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from db import get_session
from schemas import UserSignup, UserLogin, PasswordUpdate, ForgotPasswordRequest
from services.auth_service import signup, login, reset_password, logout, request_password_reset

router = APIRouter(prefix='/auth', tags=['Auth'])

@router.post("/signup")
def auth_signup(user: UserSignup, db: Session = Depends(get_session)):
    response = signup(
        email=user.email, 
        password=user.password, 
        first_name=user.first_name, 
        last_name=user.last_name
    )

    if isinstance(response, str):
        raise HTTPException(status_code=400, detail=response)

    try:
        new_profile = Profile(
            user_id=response.user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name
        )
        
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        
        return new_profile

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database sync failed: {str(e)}")

@router.post("/login")
async def auth_login(user: UserLogin):
    result = login(user.email, user.password)
    if isinstance(result, str):
        raise HTTPException(status_code=401, detail=result)
    return result.session


@router.post("/forgot-password")
async def auth_forgot_password(data: ForgotPasswordRequest):
    redirect_to = os.getenv("PASSWORD_RESET_REDIRECT_URL")
    result = request_password_reset(data.email, redirect_to=redirect_to)

    if isinstance(result, str):
        if "not configured" in result.lower():
            raise HTTPException(status_code=500, detail=result)
        raise HTTPException(status_code=400, detail=result)

    return {"message": "If an account exists for this email, a reset link has been sent."}


# TODO: Finish when working on reset password screen
@router.post("/reset-password")
async def auth_reset_password(data: PasswordUpdate):
    result = reset_password(data.new_password)
    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)
    return {"message": "Password updated"}

@router.post("/logout")
async def auth_logout():
    result = logout()
    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)
    return {"message": "Logged out"}