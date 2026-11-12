from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth import get_optional_user
from app.schemas.order_schema import OrderCreate, OrderRead
from app.services.order_service import OrderError, OrderService

router = APIRouter(prefix="/orders", tags=["orders"])
service = OrderService()


def resolve_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


@router.post("", response_model=OrderRead, include_in_schema=False)
@router.post("/", response_model=OrderRead)
def create_order(
    order_in: OrderCreate,
    request: Request,
    current_user: Optional[dict] = Depends(get_optional_user),
):
    try:
        return service.create_order(order_in.model_dump(), current_user, resolve_client_ip(request))
    except OrderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
