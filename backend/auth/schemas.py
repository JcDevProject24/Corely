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


# Schema para respuesta de cuenta social
class SocialAccountResponse(BaseModel):
    id: int
    provider: str
    provider_email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Schema para respuesta de usuario (sin password)
class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    avatar_url: Optional[str] = None
    is_email_verified: bool = False
    has_password: bool = True
    created_at: datetime
    social_accounts: list[SocialAccountResponse] = []

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


# Schema para establecer password (usuarios OAuth)
class SetPasswordRequest(BaseModel):
    password: str
