from typing import Optional

from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    username: str
    password: str
    is_admin: bool = False


class UserRead(BaseModel):
    id: int
    name: str
    username: str
    is_admin: bool
    created_at: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True
