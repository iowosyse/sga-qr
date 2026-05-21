from pydantic import BaseModel


class LoginRequest(BaseModel):
    no_control: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str


class UserResponse(BaseModel):
    id: int
    no_control: str
    nombre: str
    rol: str
