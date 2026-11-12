import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

from app.repositories.order_repository import OrderRepository
from app.services.membership_service import calculate_discount
from app.services.payment_service import PaymentService

ADMIN_PAYMENT_STATUSES = {"pending", "paid", "refunded", "cod"}


class OrderError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def generate_txn_ref() -> str:
    vietnam_now = datetime.now(timezone.utc) + timedelta(hours=7)
    return f"LC{vietnam_now.strftime('%y%m%d%H%M%S')}{uuid.uuid4().hex[:8].upper()}"


def is_http_url(value: Optional[str]) -> bool:
    return bool(value) and (value.startswith("http://") or value.startswith("https://"))


class OrderService:
    def __init__(self):
        self._repo = OrderRepository()

    def _payment_url(self, order: Dict, txn_ref: str, client_ip: str, callback_url: Optional[str]) -> str:
        payment = PaymentService.create_vnpay_payment_url(
            order_id=order["id"],
            amount=order["total_amount"],
            order_info=f"Thanh toan don hang {order['order_code']}",
            client_ip=client_ip,
            return_url=callback_url if is_http_url(callback_url) else None,
            txn_ref=txn_ref,
        )
        return payment["payment_url"]

    def create_order(
        self,
        payload: Dict,
        user: Optional[Dict],
        client_ip: str,
    ) -> Dict:
        payment_method = (payload.get("payment_method") or "cod").lower()
        if payment_method not in {"cod", "vnpay"}:
            raise OrderError("Phương thức thanh toán không hợp lệ")

        is_customer = bool(user) and not user.get("is_admin")
        txn_ref = generate_txn_ref() if payment_method == "vnpay" else None

        order = self._repo.create_order(
            payload,
            user_id=user["id"] if is_customer else None,
            discount_calculator=calculate_discount if is_customer else None,
            vnpay_txn_ref=txn_ref,
        )

        if payment_method == "vnpay":
            order["txn_ref"] = txn_ref
            order["payment_url"] = self._payment_url(order, txn_ref, client_ip, payload.get("callback_url"))
        return order

    def repay(self, order_id: int, user: Dict, client_ip: str, callback_url: Optional[str]) -> Dict:
        order = self._repo.get_order_for_user(order_id, user["id"])
        if not order:
            raise OrderError("Không tìm thấy đơn hàng", 404)
        if order["payment_method"] != "vnpay":
            raise OrderError("Đơn hàng này không thanh toán qua VNPay")
        if order["status"] == "cancelled":
            raise OrderError("Đơn hàng đã bị hủy")
        if order["payment_status"] != "pending":
            raise OrderError("Đơn hàng không ở trạng thái chờ thanh toán")

        txn_ref = generate_txn_ref()
        self._repo.start_payment_attempt(order["id"], txn_ref, order["total_amount"])
        order = self._repo.get_order(order["id"])
        order["txn_ref"] = txn_ref
        order["payment_url"] = self._payment_url(order, txn_ref, client_ip, callback_url)
        return order

    def handle_vnpay_result(self, query_params: Dict) -> Dict:
        if not PaymentService.verify_vnpay_signature(query_params):
            return {"code": "97", "message": "Invalid signature", "success": False, "order": None}

        txn_ref = query_params.get("vnp_TxnRef", "")
        transaction = self._repo.get_transaction(txn_ref)
        if not transaction:
            return {"code": "01", "message": "Order not found", "success": False, "order": None}

        try:
            paid_amount = int(query_params.get("vnp_Amount", "0")) // 100
        except ValueError:
            paid_amount = -1
        if paid_amount != int(transaction["amount"]):
            return {
                "code": "04",
                "message": "Invalid amount",
                "success": False,
                "order": self._repo.get_order(transaction["order_id"]),
            }

        response_code = query_params.get("vnp_ResponseCode", "")
        transaction_status = query_params.get("vnp_TransactionStatus", response_code)
        success = response_code == "00" and transaction_status == "00"

        order = self._repo.record_payment_result(
            txn_ref,
            success,
            {
                "response_code": response_code,
                "transaction_no": query_params.get("vnp_TransactionNo"),
                "bank_code": query_params.get("vnp_BankCode"),
                "pay_date": query_params.get("vnp_PayDate"),
            },
        )
        return {
            "code": "00",
            "message": "Confirm Success",
            "success": success,
            "order": order,
        }

    def get_order_detail_for_user(self, order_id: int, user: Dict) -> Dict:
        order = self._repo.get_order_for_user(order_id, user["id"])
        if not order:
            raise OrderError("Không tìm thấy đơn hàng", 404)
        order["transactions"] = self._repo.list_transactions(order["id"])
        return order

    def admin_set_payment_status(self, order_id: int, payment_status: str) -> Dict:
        if payment_status not in ADMIN_PAYMENT_STATUSES:
            raise OrderError("Trạng thái thanh toán không hợp lệ")
        if not self._repo.get_order(order_id):
            raise OrderError("Không tìm thấy đơn hàng", 404)
        return self._repo.set_payment_status(order_id, payment_status)
