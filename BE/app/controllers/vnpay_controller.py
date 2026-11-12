from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.schemas.order_schema import OrderRead
from app.services.order_service import OrderService
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/vnpay", tags=["vnpay"])
service = OrderService()


def _serialize_order(order):
    if not order:
        return None
    return OrderRead.model_validate(order).model_dump()


@router.get("/return")
def vnpay_return(request: Request):
    query_params = dict(request.query_params)
    if not query_params:
        return JSONResponse(status_code=400, content={"success": False, "message": "Missing VNPay query parameters"})

    result = service.handle_vnpay_result(query_params)
    if result["code"] == "97":
        return JSONResponse(status_code=400, content={"success": False, "message": "Invalid VNPay signature"})
    if result["code"] == "01":
        return JSONResponse(status_code=404, content={"success": False, "message": "Order not found"})

    return {
        "success": result["success"],
        "message": result["message"],
        "payment_result": PaymentService.build_vnpay_callback_result(query_params, True),
        "order": _serialize_order(result["order"]),
    }


@router.get("/ipn")
def vnpay_ipn(request: Request):
    result = service.handle_vnpay_result(dict(request.query_params))
    return {"RspCode": result["code"], "Message": result["message"]}
