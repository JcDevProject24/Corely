from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# Schema para registro de usuario
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


# Schema para login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Schema para respuesta de usuario (sin password)
class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


# Schema para respuesta de login con token
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Schema para el token payload
class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
