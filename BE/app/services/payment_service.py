import hashlib
import hmac
import os
import urllib.parse
import uuid
from datetime import datetime, timedelta, timezone


# ============================================================
# CẤU HÌNH THANH TOÁN GIẢ
# ============================================================

MOCK_PAYMENT_SECRET = os.getenv(
    "MOCK_PAYMENT_SECRET",
    "LUA_COSMETICS_LOCAL_PAYMENT_SECRET_2026"
)

# Frontend chạy localhost:5173
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)

VNPAY_TMN_CODE = os.getenv("VNPAY_TMN_CODE", "9VJZG58Z")
VNPAY_HASH_SECRET = os.getenv(
    "VNPAY_HASH_SECRET",
    "XBUOXBZUWOYSBJNYNMPSYBJKGJBXAWLT"
)
VNPAY_URL = os.getenv(
    "VNPAY_PAYMENT_URL",
    os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html")
)
VNPAY_RETURN_URL = os.getenv(
    "VNPAY_RETURN_URL",
    "http://localhost:8000/vnpay/return"
)


class PaymentService:

    # ========================================================
    # TẠO URL THANH TOÁN MOMO GIẢ
    # ========================================================

    @staticmethod
    def create_momo_payment_url(
        order_id: str | int,
        amount: int,
        order_info: str = "Thanh toan don hang LUA Cosmetics"
    ) -> str:

        order_id = int(order_id)
        amount = int(amount)

        # ----------------------------------------------------
        # Tạo token chữ ký cho giao dịch giả
        # Không cần lưu token vào database
        # ----------------------------------------------------

        raw_data = f"{order_id}|{amount}"

        token = hmac.new(
            MOCK_PAYMENT_SECRET.encode("utf-8"),
            raw_data.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # ----------------------------------------------------
        # URL giả mà QR sẽ chứa
        #
        # Frontend có thể dùng URL này để tạo QR.
        # ----------------------------------------------------

        query = urllib.parse.urlencode({
            "order_id": order_id,
            "amount": amount,
            "token": token,
        })

        payment_url = (
            f"{FRONTEND_URL}/thanh-toan-momo?"
            f"{query}"
        )

        print("\n" + "=" * 60)
        print("MOCK MOMO PAYMENT")
        print("Order ID:", order_id)
        print("Amount:", amount)
        print("Payment URL:", payment_url)
        print("=" * 60 + "\n")

        return payment_url

    # ========================================================
    # XÁC THỰC URL THANH TOÁN GIẢ
    # ========================================================

    @staticmethod
    def verify_mock_payment(
        order_id: int,
        amount: int,
        token: str
    ) -> bool:

        raw_data = f"{int(order_id)}|{int(amount)}"

        expected_token = hmac.new(
            MOCK_PAYMENT_SECRET.encode("utf-8"),
            raw_data.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(
            expected_token,
            token
        )

    # ========================================================
    # VNPay Sandbox
    # ========================================================

    @staticmethod
    def verify_momo_signature(data: dict) -> bool:
        return False

    @staticmethod
    def build_vnpay_request_params(
        amount: int | float,
        txn_ref: str,
        order_info: str,
        client_ip: str = "127.0.0.1",
        return_url: str | None = None,
    ) -> dict:
        amount_value = int(float(amount) * 100)
        if amount_value <= 0:
            raise ValueError("Amount must be a positive number")

        now = datetime.now(timezone.utc) + timedelta(hours=7)
        create_date = now.strftime("%Y%m%d%H%M%S")

        params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": VNPAY_TMN_CODE,
            "vnp_Amount": str(amount_value),
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": txn_ref,
            "vnp_OrderInfo": order_info,
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": return_url if return_url is not None else VNPAY_RETURN_URL,
            "vnp_IpAddr": client_ip,
            "vnp_CreateDate": create_date,
        }

        return params

    @staticmethod
    def generate_vnpay_secure_hash(params: dict) -> str:
        filtered_params = {
            key: value for key, value in params.items()
            if key not in {"vnp_SecureHash", "vnp_SecureHashType"}
            and value is not None
            and str(value).strip() != ""
        }
        sorted_items = sorted(filtered_params.items())
        query_string = urllib.parse.urlencode(
            [(key, value) for key, value in sorted_items],
            doseq=True,
            safe="",
        )
        return hmac.new(
            VNPAY_HASH_SECRET.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest().upper()

    @staticmethod
    def create_vnpay_payment_url(
        order_id: str | int,
        amount: int | float,
        order_info: str = "Thanh toan don hang LUA Cosmetics",
        client_ip: str = "127.0.0.1",
        return_url: str | None = None,
        txn_ref: str | None = None,
    ) -> dict:
        if not isinstance(order_id, (str, int)):
            raise ValueError("Order ID must be a string or integer")

        amount_value = int(float(amount))
        if amount_value <= 0:
            raise ValueError("Amount must be a positive number")

        resolved_txn_ref = str(txn_ref or f"vnpay-{uuid.uuid4().hex}")
        params = PaymentService.build_vnpay_request_params(
            amount=amount_value,
            txn_ref=resolved_txn_ref,
            order_info=order_info,
            client_ip=client_ip,
            return_url=return_url,
        )

        params["vnp_SecureHash"] = PaymentService.generate_vnpay_secure_hash(params)

        encoded_query = urllib.parse.urlencode(
            [(key, value) for key, value in sorted(params.items()) if value is not None and str(value).strip() != ""],
            doseq=True,
            safe="",
        )
        payment_url = f"{VNPAY_URL}?{encoded_query}"

        return {
            "payment_url": payment_url,
            "txn_ref": params["vnp_TxnRef"],
            "params": params,
        }

    @staticmethod
    def verify_vnpay_signature(data: dict) -> bool:
        received_hash = data.get("vnp_SecureHash", "")
        if not received_hash:
            return False

        filtered_params = {
            key: value for key, value in data.items()
            if key not in {"vnp_SecureHash", "vnp_SecureHashType"}
            and value is not None
            and str(value).strip() != ""
        }
        sorted_items = sorted(filtered_params.items())
        query_string = urllib.parse.urlencode(
            [(key, value) for key, value in sorted_items],
            doseq=True,
            safe="",
        )
        expected_hash = hmac.new(
            VNPAY_HASH_SECRET.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest().upper()
        return hmac.compare_digest(received_hash.upper(), expected_hash)

    @staticmethod
    def build_vnpay_callback_result(data: dict, signature_valid: bool) -> dict:
        response_code = data.get("vnp_ResponseCode", "")
        transaction_status = data.get("vnp_TransactionStatus", "")

        if signature_valid and not response_code:
            response_code = "00"
        if signature_valid and not transaction_status:
            transaction_status = "00"

        success = signature_valid and response_code == "00" and transaction_status == "00"

        return {
            "success": success,
            "signature_valid": signature_valid,
            "vnp_ResponseCode": response_code,
            "vnp_TransactionStatus": transaction_status,
            "vnp_TxnRef": data.get("vnp_TxnRef", ""),
            "vnp_Amount": data.get("vnp_Amount", ""),
            "vnp_TransactionNo": data.get("vnp_TransactionNo", ""),
            "vnp_BankCode": data.get("vnp_BankCode", ""),
            "vnp_PayDate": data.get("vnp_PayDate", ""),
            "vnp_OrderInfo": data.get("vnp_OrderInfo", ""),
        }