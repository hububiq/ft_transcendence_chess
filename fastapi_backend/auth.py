import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
from pydantic import BaseModel

# This tells FastAPI to look for the "Authorization: Bearer <token>" header
security = HTTPBearer()

# Creates a tiny dummy class so frontend code can do `user.id`
class UserInfo(BaseModel):
    id: int

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInfo:
    token = credentials.credentials
    
    try:
        # 1. DECODE THE TOKEN 
        # We use the exact same SECRET_KEY that Django used to create it
        payload = jwt.decode(
            token, 
            settings.jwt_secret_key, 
            algorithms=[settings.jwt_algorithm]
        )
        
        # 2. Extract the user ID. (Django SimpleJWT calls it 'user_id' inside the token)
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid token payload"
            )
        
        # 3. Return object
        return UserInfo(id=int(user_id))
        
    # Catch expired tokens
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token has expired. Please log in again."
        )
    # Catch fake/hacked tokens
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Could not validate credentials."
        )