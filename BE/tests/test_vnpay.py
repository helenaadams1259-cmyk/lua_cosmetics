from app.services.payment_service import VNPAY_TMN_CODE, PaymentService


def test_payment_service_builds_expected_signature_data():
    params = PaymentService.build_vnpay_request_params(
        amount=10000,
        txn_ref="LC123",
        order_info="Lua Cosmetics payment",
        client_ip="127.0.0.1",
        return_url="http://localhost:8080/dat-hang-thanh-cong",
    )

    assert params["vnp_Amount"] == "1000000"
    assert params["vnp_Command"] == "pay"
    assert params["vnp_CurrCode"] == "VND"
    assert params["vnp_TxnRef"] == "LC123"
    assert params["vnp_Version"] == "2.1.0"
    assert params["vnp_TmnCode"] == VNPAY_TMN_CODE


def test_signature_round_trip_and_tamper_detection():
    params = PaymentService.build_vnpay_request_params(amount=5000, txn_ref="LC456", order_info="Thanh toan")
    params["vnp_SecureHash"] = PaymentService.generate_vnpay_secure_hash(params)
    assert PaymentService.verify_vnpay_signature(params) is True

    params["vnp_Amount"] = "1"
    assert PaymentService.verify_vnpay_signature(params) is False
