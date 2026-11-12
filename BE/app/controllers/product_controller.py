from typing import List, Optional

from math import ceil
from fastapi import APIRouter, HTTPException, Query

from app.schemas.pagination_schema import PaginatedResponse
from app.schemas.product_schema import ProductRead, ProductHighlights
from app.services.base_service import BaseService
from app.repositories.product_repository import ProductRepository

router = APIRouter(prefix="/products", tags=["products"])
service = BaseService(ProductRepository())

@router.get("/", response_model=List[ProductRead])
def list_products(q: Optional[str] = None):
    repo = ProductRepository()
    return repo.filter_products(q=q)


@router.get("/highlights", response_model=ProductHighlights)
def product_highlights():
    repository = ProductRepository()
    return {
        "featured": repository.list_by_flag("is_featured", limit=10),
        "best_sellers": repository.list_by_flag("is_best_seller", limit=10),
        "new_arrivals": repository.list_by_flag("is_new", limit=10),
        "newest": repository.list_newest(limit=10),
    }


@router.get("/slug/{slug}", response_model=ProductRead)
def get_product_by_slug(slug: str):
    product = ProductRepository().get_by_slug(slug)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/{slug}/{product_id}", response_model=ProductRead)
def get_product(slug: str, product_id: int):
    product = service.get(product_id)
    if not product or product.get("slug") != slug:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/product-filter", response_model=PaginatedResponse)
def product_filter(
    slug: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    brands: Optional[List[int]] = Query(None),
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
):
    offset = (page - 1) * page_size
    repo = ProductRepository()
    data = repo.filter_products(slug=slug, min_price=min_price, max_price=max_price, brands=brands, q=q, offset=offset, limit=page_size)
    total = repo.count_filtered(slug=slug, min_price=min_price, max_price=max_price, brands=brands, q=q)
    maxPage = ceil(total / page_size) if total else 1
    return {"data": data, "total": total, "maxPage": maxPage}
