from math import ceil
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from app.auth import get_current_user
from app.controllers.order_controller import resolve_client_ip
from app.repositories.order_repository import OrderRepository
from app.schemas.account_schema import (
    AccountLogin,
    AccountRead,
    AccountRegister,
    AccountSession,
    AccountUpdate,
    ChangePassword,
    ForgotPassword,
    MembershipPreview,
    MembershipSummary,
    ResetPassword,
)
from app.schemas.order_schema import OrderRead, RepayRequest
from app.schemas.pagination_schema import PaginatedResponse
from app.services.account_service import AccountError, AccountService
from app.services.membership_service import MembershipService
from app.services.order_service import OrderError, OrderService

router = APIRouter(prefix="/account", tags=["account"])
account_service = AccountService()
membership_service = MembershipService()
order_service = OrderService()
order_repo = OrderRepository()

ORDER_STATUS_FILTERS = {"awaiting_payment", "processing", "paid", "shipping", "completed", "cancelled"}


def require_customer(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Tài khoản quản trị không dùng được chức năng này")
    return current_user


def _raise(exc: AccountError | OrderError):
    raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/register", response_model=AccountSession)
def register(payload: AccountRegister):
    try:
        return account_service.register(payload.name, payload.email, payload.phone, payload.password)
    except AccountError as exc:
        _raise(exc)


@router.post("/login", response_model=AccountSession)
def login(payload: AccountLogin):
    try:
        return account_service.login(payload.identifier, payload.password)
    except AccountError as exc:
        _raise(exc)


@router.get("/me", response_model=AccountRead)
def get_me(current_user: dict = Depends(require_customer)):
    return account_service.to_account(current_user)


@router.put("/me", response_model=AccountRead)
def update_me(payload: AccountUpdate, current_user: dict = Depends(require_customer)):
    try:
        return account_service.update_profile(current_user["id"], payload.model_dump())
    except AccountError as exc:
        _raise(exc)


@router.post("/change-password")
def change_password(payload: ChangePassword, current_user: dict = Depends(require_customer)):
    try:
        account_service.change_password(current_user["id"], payload.current_password, payload.new_password)
    except AccountError as exc:
        _raise(exc)
    return {"success": True, "message": "Đổi mật khẩu thành công"}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPassword):
    try:
        account_service.request_password_reset(payload.email, payload.reset_url)
    except AccountError as exc:
        _raise(exc)
    return {
        "success": True,
        "message": "Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.",
    }


@router.get("/reset-password/validate")
def validate_reset_token(token: str):
    return {"valid": account_service.is_reset_token_valid(token)}


@router.post("/reset-password")
def reset_password(payload: ResetPassword):
    try:
        account_service.reset_password(payload.token, payload.new_password)
    except AccountError as exc:
        _raise(exc)
    return {"success": True, "message": "Đặt lại mật khẩu thành công"}


@router.get("/membership", response_model=MembershipSummary)
def get_membership(current_user: dict = Depends(require_customer)):
    return membership_service.summary(current_user["id"])


@router.get("/membership/preview", response_model=MembershipPreview)
def preview_membership_discount(
    subtotal: int,
    shipping_fee: int = 30000,
    current_user: dict = Depends(require_customer),
):
    return membership_service.preview(current_user["id"], max(subtotal, 0), max(shipping_fee, 0))


@router.get("/orders", response_model=PaginatedResponse)
def list_my_orders(
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    current_user: dict = Depends(require_customer),
):
    status_filter = status if status in ORDER_STATUS_FILTERS else None
    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)
    orders = order_repo.list_orders_by_user(
        current_user["id"],
        status_filter=status_filter,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    total = order_repo.count_orders_by_user(current_user["id"], status_filter=status_filter)
    return {
        "data": [OrderRead.model_validate(order).model_dump() for order in orders],
        "total": total,
        "maxPage": ceil(total / page_size) if total else 1,
    }


@router.get("/orders/counts")
def count_my_orders(current_user: dict = Depends(require_customer)):
    counts = {"all": order_repo.count_orders_by_user(current_user["id"])}
    for status_filter in ORDER_STATUS_FILTERS:
        counts[status_filter] = order_repo.count_orders_by_user(current_user["id"], status_filter=status_filter)
    return counts


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_my_order(order_id: int, current_user: dict = Depends(require_customer)):
    try:
        return order_service.get_order_detail_for_user(order_id, current_user)
    except OrderError as exc:
        _raise(exc)


@router.post("/orders/{order_id}/repay", response_model=OrderRead)
def repay_my_order(
    order_id: int,
    payload: RepayRequest,
    request: Request,
    current_user: dict = Depends(require_customer),
):
    try:
        return order_service.repay(order_id, current_user, resolve_client_ip(request), payload.callback_url)
    except OrderError as exc:
        _raise(exc)
