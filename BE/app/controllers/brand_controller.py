from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.brand_schema import BrandRead
from app.services.base_service import BaseService
from app.repositories.brand_repository import BrandRepository

router = APIRouter(prefix="/brands", tags=["brands"])
service = BaseService(BrandRepository())

@router.get("/", response_model=List[BrandRead])
def list_brands():
    return service.list()

@router.get("/{brand_id}", response_model=BrandRead)
def get_brand(brand_id: int):
    brand = service.get(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand
