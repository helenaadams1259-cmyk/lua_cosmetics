from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.category_schema import CategoryRead
from app.services.base_service import BaseService
from app.repositories.category_repository import CategoryRepository

router = APIRouter(prefix="/categories", tags=["categories"])
service = BaseService(CategoryRepository())

@router.get("/", response_model=List[CategoryRead])
def list_categories():
    return service.list()

@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: int):
    category = service.get(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category
