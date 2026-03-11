from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from services.auth_service import supabase

security = HTTPBearer()

def get_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase is not configured on the server.",
        )

    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="User not found"
            )
            
        return user_response.user
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )