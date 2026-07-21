from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: str
    password: str
    invite_code: str


class LoginRequest(BaseModel):
    account: str  # email or username
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: str
    created_at: str

    class Config:
        from_attributes = True
