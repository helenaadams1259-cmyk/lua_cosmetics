from typing import Optional
from pydantic import BaseModel


class BrandCreate(BaseModel):
    name: str
    description: Optional[str] = None


class BrandRead(BrandCreate):
    id: int

    class Config:
        from_attributes = True
