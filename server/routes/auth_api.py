import os

from models import Profile

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from db import get_session
from schemas import UserSignup, UserLogin, PasswordUpdate, ForgotPasswordRequest, CodeExchangeRequest
from services.auth_service import signup, login, reset_password, logout, request_password_reset, exchange_code

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


@router.post("/exchange-code")
async def auth_exchange_code(data: CodeExchangeRequest):
    """Exchange a Supabase PKCE recovery code for a session (used after password-reset email link)."""
    result = exchange_code(data.code)
    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)
    # Return the session so the frontend can use the access token.
    return result.session


@router.post("/reset-password")
async def auth_reset_password(
    data: PasswordUpdate,
    authorization: str = Header(..., alias="Authorization"),
):
    """Update the authenticated user's password. Requires Bearer token from exchange-code step."""
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization[len("bearer "):].strip()
    result = reset_password(data.new_password, token)
    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)
    return {"message": "Password updated"}

@router.post("/logout")
async def auth_logout():
    result = logout()
    if isinstance(result, str):
        raise HTTPException(status_code=400, detail=result)
    return {"message": "Logged out"}