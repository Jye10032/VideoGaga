from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class RegisterRequest(BaseModel):
    email: Optional[EmailStr] = None
    username: str = Field(min_length=3, max_length=40, pattern=r"^[\w-]+$")
    password: str = Field(min_length=10, max_length=72)
    invite_code: str = Field(min_length=1, max_length=32)

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode()) > 72:
            raise ValueError("密码最多 72 字节")
        return value


class LoginRequest(BaseModel):
    account: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=72)

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode()) > 72:
            raise ValueError("密码最多 72 字节")
        return value


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
