from math import ceil
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import PlainTextResponse

from app.auth import get_current_user, require_admin
from app.schemas.category_schema import CategoryCreate, CategoryRead, CategoryUpdate
from app.schemas.brand_schema import BrandCreate, BrandRead
from app.schemas.order_schema import AdminStats, OrderPaymentStatusUpdate, OrderRead, OrderStatusUpdate, OrderUpdate
from app.schemas.pagination_schema import PaginatedResponse
from app.schemas.product_schema import ProductCreate, ProductRead
from app.schemas.user_schema import UserCreate, UserRead
from app.services.base_service import BaseService
from app.services.product_import_service import build_bulk_import_template, parse_products_from_csv_bytes
from app.services.order_service import OrderError, OrderService
from app.services.user_service import UserService
from app.repositories.category_repository import CategoryRepository
from app.repositories.brand_repository import BrandRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.order_repository import OrderRepository

router = APIRouter(prefix="/admin", tags=["admin"])
category_repo = CategoryRepository()
brand_repo = BrandRepository()
category_service = BaseService(category_repo)
brand_service = BaseService(brand_repo)
product_repo = ProductRepository()
product_service = BaseService(product_repo)
user_service = UserService()
order_repo = OrderRepository()
order_service = OrderService()

@router.get("/me", response_model=UserRead)
def get_admin_me(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return {
        "id": current_user.get("id"),
        "name": current_user.get("name"),
        "username": current_user.get("username"),
        "is_admin": bool(current_user.get("is_admin")),
        "created_at": current_user.get("created_at") or "",
    }

@router.post("/categories", response_model=CategoryRead, dependencies=[Depends(require_admin)])
def create_category(category_in: CategoryCreate):
    return category_service.create(category_in.dict())

@router.get("/categories", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_categories_admin(page: int = 1, page_size: int = 10, q: str = None):
    offset = (page - 1) * page_size
    data = category_repo.search_admin(q=q, offset=offset, limit=page_size)
    total = category_repo.count_search_admin(q=q)
    maxPage = ceil(total / page_size) if total else 1
    return {"data": data, "total": total, "maxPage": maxPage}

@router.put("/categories/{category_id}", response_model=CategoryRead, dependencies=[Depends(require_admin)])
def update_category(category_id: int, category_in: CategoryUpdate):
    category = category_service.update(category_id, category_in.dict(exclude_unset=True))
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.delete("/categories/{category_id}", dependencies=[Depends(require_admin)])
def delete_category(category_id: int):
    deleted = category_service.delete(category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"deleted": True}

@router.post("/brands", response_model=BrandRead, dependencies=[Depends(require_admin)])
def create_brand(brand_in: BrandCreate):
    return brand_service.create(brand_in.dict())

@router.get("/brands", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_brands_admin(page: int = 1, page_size: int = 10, q: str = None):
    offset = (page - 1) * page_size
    data = brand_repo.search_admin(q=q, offset=offset, limit=page_size)
    total = brand_repo.count_search_admin(q=q)
    maxPage = ceil(total / page_size) if total else 1
    return {"data": data, "total": total, "maxPage": maxPage}

@router.get("/products", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_products_admin(page: int = 1, page_size: int = 10, q: str = None, category_id: int = None, brand_id: int = None):
    offset = (page - 1) * page_size
    data = product_repo.search_admin_products(
        q=q,
        category_id=category_id,
        brand_id=brand_id,
        offset=offset,
        limit=page_size,
    )
    total = product_repo.count_search_admin_products(q=q, category_id=category_id, brand_id=brand_id)
    maxPage = ceil(total / page_size) if total else 1
    return {"data": data, "total": total, "maxPage": maxPage}

@router.put("/brands/{brand_id}", response_model=BrandRead, dependencies=[Depends(require_admin)])
def update_brand(brand_id: int, brand_in: BrandCreate):
    brand = brand_service.update(brand_id, brand_in.dict())
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@router.delete("/brands/{brand_id}", dependencies=[Depends(require_admin)])
def delete_brand(brand_id: int):
    deleted = brand_service.delete(brand_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"deleted": True}

@router.post("/products", response_model=ProductRead, dependencies=[Depends(require_admin)])
def create_product(product_in: ProductCreate):
    return product_service.create(product_in.dict())

@router.post("/products/bulk-csv", dependencies=[Depends(require_admin)])
def create_products_bulk_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    contents = file.file.read()
    try:
        import_result = parse_products_from_csv_bytes(contents, file.filename, category_repo=category_repo, brand_repo=brand_repo)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    created_products: List[ProductRead] = []
    for item in import_result["products"]:
        row_number = item["row_number"]
        product_data = item["product"]
        try:
            created_products.append(product_service.create(product_data))
        except Exception as exc:
            import_result["errors"].append({"row_number": row_number, "message": f"insert failed: {exc}"})
            import_result["failed_rows"] += 1

    return {
        "total_rows": import_result["total_rows"],
        "imported_rows": import_result["imported_rows"],
        "failed_rows": import_result["failed_rows"],
        "errors": import_result["errors"],
        "products": created_products,
    }

@router.get("/products/bulk-csv/template")
def download_bulk_csv_template():
    return PlainTextResponse(build_bulk_import_template(), media_type="text/csv; charset=utf-8")

@router.put("/products/{product_id}", response_model=ProductRead, dependencies=[Depends(require_admin)])
def update_product(product_id: int, product_in: ProductCreate):
    product = product_service.update(product_id, product_in.dict())
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.delete("/products/{product_id}", dependencies=[Depends(require_admin)])
def delete_product(product_id: int):
    deleted = product_service.delete(product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"deleted": True}


@router.get("/orders", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_orders_admin(page: int = 1, page_size: int = 10, q: str = None, payment_status: str = None):
    offset = (page - 1) * page_size
    orders = order_repo.list_orders_with_items(offset=offset, limit=page_size, q=q, payment_status=payment_status)
    for order in orders:
        order["transactions"] = order_repo.list_transactions(order["id"]) if order["payment_method"] == "vnpay" else []
    total = order_repo.count_orders(q=q, payment_status=payment_status)
    maxPage = ceil(total / page_size) if total else 1
    data = [OrderRead.model_validate(order).model_dump() for order in orders]
    return {"data": data, "total": total, "maxPage": maxPage}

@router.put("/orders/{order_id}/payment", response_model=OrderRead, dependencies=[Depends(require_admin)])
def update_order_payment_status(order_id: int, payment_in: OrderPaymentStatusUpdate):
    try:
        return order_service.admin_set_payment_status(order_id, payment_in.payment_status)
    except OrderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

@router.get("/stats", response_model=AdminStats, dependencies=[Depends(require_admin)])
def admin_stats():
    return {
        "users": user_service.count_users(),
        "orders": order_repo.count_orders(),
        "categories": category_service.count(),
        "brands": brand_service.count(),
    }

@router.put("/orders/{order_id}", response_model=OrderRead, dependencies=[Depends(require_admin)])
def update_order(order_id: int, order_in: OrderUpdate):
    order = order_repo.update_order(order_id, order_in.dict(exclude_unset=True))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/orders/{order_id}/status", response_model=OrderRead, dependencies=[Depends(require_admin)])
def update_order_status(order_id: int, status_in: OrderStatusUpdate):
    order = order_repo.update_status(order_id, status_in.status)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.delete("/orders/{order_id}", dependencies=[Depends(require_admin)])
def delete_order(order_id: int):
    deleted = order_repo.delete_order(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"deleted": True}

@router.post("/users", response_model=UserRead, dependencies=[Depends(require_admin)])
def create_user(user_in: UserCreate):
    try:
        return user_service.create_user(user_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

@router.get("/users", response_model=PaginatedResponse, dependencies=[Depends(require_admin)])
def list_users(page: int = 1, page_size: int = 10):
    offset = (page - 1) * page_size
    data = user_service.get_users(offset=offset, limit=page_size)
    total = user_service.count_users()
    maxPage = ceil(total / page_size) if total else 1
    return {"data": data, "total": total, "maxPage": maxPage}

@router.get("/users/{user_id}", response_model=UserRead, dependencies=[Depends(require_admin)])
def get_user(user_id: int):
    user = user_service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserRead, dependencies=[Depends(require_admin)])
def update_user(user_id: int, user_in: UserCreate):
    try:
        user = user_service.update_user(user_id, user_in)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
def delete_user(user_id: int):
    deleted = user_service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": True}
