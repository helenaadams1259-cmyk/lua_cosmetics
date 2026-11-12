from typing import List, Optional

from pydantic import BaseModel


class ProductCreate(BaseModel):
    category_id: int
    brand_id: Optional[int] = None
    name: str
    slug: str
    short_description: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    usage: Optional[str] = None
    origin: Optional[str] = None
    skin_type: Optional[str] = None
    volume: Optional[str] = None
    price: int
    original_price: Optional[int] = None
    stock: Optional[int] = 0
    rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    discount_percent: Optional[int] = 0
    images: Optional[List[str]] = None
    is_featured: Optional[int] = 0
    is_best_seller: Optional[int] = 0
    is_new: Optional[int] = 0


class ProductRead(ProductCreate):
    id: int
    created_at: str

    class Config:
        from_attributes = True


class ProductHighlights(BaseModel):
    featured: List[ProductRead]
    best_sellers: List[ProductRead]
    new_arrivals: List[ProductRead]
    newest: List[ProductRead]
