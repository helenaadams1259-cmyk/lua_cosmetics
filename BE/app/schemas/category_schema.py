from typing import Optional

from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    slug: str


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None


class CategoryRead(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True
