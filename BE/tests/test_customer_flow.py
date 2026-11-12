import urllib.parse
import uuid

import pytest
from fastapi.testclient import TestClient

from app.db import get_connection
from app.main import app
from app.services.account_service import AccountService
from app.services.payment_service import PaymentService

client = TestClient(app)

PASSWORD = "matkhau123"
CALLBACK_URL = "http://localhost:8080/dat-hang-thanh-cong"


def run_sql(sql: str, params: tuple = ()):
    cursor = get_connection().cursor()
    cursor.execute(sql, params)
    return cursor.fetchall()


def register_customer(name: str = "Nguyễn Văn A") -> dict:
    suffix = uuid.uuid4().hex[:8]
    phone = "09" + str(uuid.uuid4().int)[:8]
    response = client.post(
        "/account/register",
        json={"name": name, "email": f"khach_{suffix}@example.com", "phone": phone, "password": PASSWORD},
    )
    assert response.status_code == 200, response.text
    session = response.json()
    session["headers"] = {"Authorization": f"Bearer {session['access_token']}"}
    return session


def admin_headers() -> dict:
    response = client.post("/auth/login", json={"username": "admin", "password": "admin123"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def pick_product(min_stock: int = 5) -> dict:
    rows = run_sql(
        "SELECT id, name, price, stock FROM products WHERE stock >= %s ORDER BY price DESC LIMIT 1",
        (min_stock,),
    )
    assert rows, "Cần ít nhất một sản phẩm còn hàng trong dữ liệu mẫu"
    return rows[0]


def order_payload(product: dict, quantity: int = 1, payment_method: str = "cod") -> dict:
    subtotal = product["price"] * quantity
    return {
        "customer_name": "Nguyễn Văn A",
        "phone": "0912345678",
        "email": "",
        "province": "TP. Hồ Chí Minh",
        "district": "Quận 1",
        "ward": "Phường Bến Nghé",
        "street_address": "123 Nguyễn Huệ",
        "payment_method": payment_method,
        "subtotal": subtotal,
        "shipping_fee": 30000,
        "total_amount": subtotal + 30000,
        "callback_url": CALLBACK_URL,
        "items": [
            {
                "product_id": product["id"],
                "product_name": product["name"],
                "product_image": "https://example.com/anh.jpg",
                "product_price": product["price"],
                "quantity": quantity,
                "subtotal": subtotal,
            }
        ],
    }


def vnpay_return_params(payment_url: str, response_code: str = "00") -> dict:
    query = urllib.parse.parse_qs(urllib.parse.urlparse(payment_url).query)
    params = {
        "vnp_Amount": query["vnp_Amount"][0],
        "vnp_BankCode": "NCB",
        "vnp_OrderInfo": query["vnp_OrderInfo"][0],
        "vnp_PayDate": "20261111103000",
        "vnp_ResponseCode": response_code,
        "vnp_TmnCode": query["vnp_TmnCode"][0],
        "vnp_TransactionNo": "14567890",
        "vnp_TransactionStatus": response_code,
        "vnp_TxnRef": query["vnp_TxnRef"][0],
    }
    params["vnp_SecureHash"] = PaymentService.generate_vnpay_secure_hash(params)
    return params


def test_kich_ban_1_dang_ky_hop_le_tu_dong_dang_nhap():
    session = register_customer("Trần Thị B")
    assert session["access_token"]
    assert session["user"]["name"] == "Trần Thị B"
    assert session["user"]["membership"]["tier"]["code"] == "member"

    me = client.get("/account/me", headers=session["headers"])
    assert me.status_code == 200
    assert me.json()["email"] == session["user"]["email"]

    stored = run_sql("SELECT password FROM users WHERE id = %s", (session["user"]["id"],))[0]["password"]
    assert stored != PASSWORD
    assert stored.startswith("$2")


def test_dang_ky_trung_email_bi_tu_choi():
    session = register_customer()
    response = client.post(
        "/account/register",
        json={"name": "Người khác", "email": session["user"]["email"], "phone": "0987654321", "password": PASSWORD},
    )
    assert response.status_code == 400
    assert "Email" in response.json()["detail"]


def test_dang_ky_mat_khau_ngan_bi_tu_choi():
    response = client.post(
        "/account/register",
        json={"name": "Ngắn", "email": f"ngan_{uuid.uuid4().hex[:6]}@example.com", "phone": "0911111111", "password": "1234567"},
    )
    assert response.status_code == 400


def test_kich_ban_2_dang_nhap_sai_mat_khau():
    session = register_customer()
    wrong = client.post("/account/login", json={"identifier": session["user"]["email"], "password": "saimatkhau"})
    assert wrong.status_code == 401
    assert "access_token" not in wrong.json()

    by_email = client.post("/account/login", json={"identifier": session["user"]["email"], "password": PASSWORD})
    assert by_email.status_code == 200
    by_phone = client.post("/account/login", json={"identifier": session["user"]["phone"], "password": PASSWORD})
    assert by_phone.status_code == 200


def test_tai_khoan_quan_tri_khong_dang_nhap_duoc_o_trang_khach():
    response = client.post("/account/login", json={"identifier": "admin", "password": "admin123"})
    assert response.status_code == 401


def test_cap_nhat_thong_tin_ca_nhan():
    session = register_customer()
    response = client.put(
        "/account/me",
        headers=session["headers"],
        json={
            "name": "Tên Mới",
            "phone": session["user"]["phone"],
            "province": "TP. Hà Nội",
            "district": "Quận Ba Đình",
            "ward": "Phường Kim Mã",
            "street_address": "45 Kim Mã",
        },
    )
    assert response.status_code == 200, response.text
    account = client.get("/account/me", headers=session["headers"]).json()
    assert account["name"] == "Tên Mới"
    assert account["street_address"] == "45 Kim Mã"
    assert account["district"] == "Quận Ba Đình"


def test_kich_ban_3_mua_cod_khi_da_dang_nhap():
    session = register_customer()
    product = pick_product()
    response = client.post("/orders", json=order_payload(product), headers=session["headers"])
    assert response.status_code == 200, response.text
    order = response.json()
    assert order["user_id"] == session["user"]["id"]
    assert order["payment_method"] == "cod"
    assert order["payment_status"] == "cod"
    assert order["order_code"].startswith("LC")

    listing = client.get("/account/orders", headers=session["headers"]).json()
    assert listing["total"] == 1
    assert listing["data"][0]["id"] == order["id"]
    assert listing["data"][0]["items"][0]["product_id"] == product["id"]


def test_kich_ban_4_thanh_toan_vnpay_thanh_cong():
    session = register_customer()
    product = pick_product()
    response = client.post("/orders", json=order_payload(product, payment_method="vnpay"), headers=session["headers"])
    assert response.status_code == 200, response.text
    order = response.json()

    assert order["payment_status"] == "pending"
    assert order["vnpay_txn_ref"]
    assert order["payment_url"].startswith("https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?")
    assert f"vnp_Amount={order['total_amount'] * 100}" in order["payment_url"]
    stored = run_sql("SELECT payment_status, vnpay_txn_ref FROM orders WHERE id = %s", (order["id"],))[0]
    assert stored["payment_status"] == "pending"
    assert stored["vnpay_txn_ref"] == order["vnpay_txn_ref"]

    callback = client.get("/vnpay/return", params=vnpay_return_params(order["payment_url"]))
    assert callback.status_code == 200, callback.text
    assert callback.json()["success"] is True
    assert callback.json()["order"]["payment_status"] == "paid"

    again = client.get("/vnpay/ipn", params=vnpay_return_params(order["payment_url"]))
    assert again.json()["RspCode"] == "00"

    detail = client.get(f"/account/orders/{order['id']}", headers=session["headers"]).json()
    assert detail["payment_status"] == "paid"
    assert detail["vnpay_transaction_no"] == "14567890"
    assert detail["vnpay_bank_code"] == "NCB"
    assert detail["paid_at"]
    assert detail["transactions"][0]["status"] == "success"

    paid_filter = client.get("/account/orders", params={"status": "paid"}, headers=session["headers"]).json()
    assert paid_filter["total"] == 1


def test_vnpay_chu_ky_sai_bi_tu_choi():
    session = register_customer()
    order = client.post(
        "/orders", json=order_payload(pick_product(), payment_method="vnpay"), headers=session["headers"]
    ).json()
    params = vnpay_return_params(order["payment_url"])
    params["vnp_Amount"] = "100"
    response = client.get("/vnpay/return", params=params)
    assert response.status_code == 400
    assert run_sql("SELECT payment_status FROM orders WHERE id = %s", (order["id"],))[0]["payment_status"] == "pending"


def test_kich_ban_5_su_co_giua_chung_giu_cho_thanh_toan_va_thanh_toan_lai():
    session = register_customer()
    product = pick_product()
    order = client.post(
        "/orders", json=order_payload(product, payment_method="vnpay"), headers=session["headers"]
    ).json()

    awaiting = client.get("/account/orders", params={"status": "awaiting_payment"}, headers=session["headers"]).json()
    assert awaiting["total"] == 1
    assert awaiting["data"][0]["payment_status"] == "pending"

    failed = client.get("/vnpay/return", params=vnpay_return_params(order["payment_url"], response_code="24"))
    assert failed.status_code == 200
    assert failed.json()["success"] is False
    assert failed.json()["order"]["payment_status"] == "pending"

    repay = client.post(
        f"/account/orders/{order['id']}/repay", json={"callback_url": CALLBACK_URL}, headers=session["headers"]
    )
    assert repay.status_code == 200, repay.text
    retried = repay.json()
    assert retried["vnpay_txn_ref"] != order["vnpay_txn_ref"]
    assert retried["payment_url"].startswith("https://sandbox.vnpayment.vn/")

    success = client.get("/vnpay/return", params=vnpay_return_params(retried["payment_url"]))
    assert success.json()["order"]["payment_status"] == "paid"

    detail = client.get(f"/account/orders/{order['id']}", headers=session["headers"]).json()
    assert [t["status"] for t in detail["transactions"]] == ["success", "failed"]

    repay_again = client.post(f"/account/orders/{order['id']}/repay", json={}, headers=session["headers"])
    assert repay_again.status_code == 400


def test_khong_thanh_toan_lai_duoc_don_cua_nguoi_khac():
    owner = register_customer()
    other = register_customer()
    order = client.post(
        "/orders", json=order_payload(pick_product(), payment_method="vnpay"), headers=owner["headers"]
    ).json()
    assert client.get(f"/account/orders/{order['id']}", headers=other["headers"]).status_code == 404
    assert client.post(f"/account/orders/{order['id']}/repay", json={}, headers=other["headers"]).status_code == 404


def test_kich_ban_6_vuot_nguong_hang_duoc_giam_ngay_trong_luc_thanh_toan():
    session = register_customer()
    product = run_sql(
        "SELECT id, name, price, stock FROM products WHERE stock >= 20 AND price BETWEEN 100000 AND 400000 "
        "ORDER BY price DESC LIMIT 1"
    )[0]
    quantity = 600000 // product["price"] + 1
    subtotal = product["price"] * quantity
    assert 500000 <= subtotal + 30000 < 2000000

    preview = client.get(
        "/account/membership/preview", params={"subtotal": subtotal}, headers=session["headers"]
    ).json()
    assert preview["current_tier"]["code"] == "member"
    assert preview["applied_tier"]["code"] == "silver"
    assert preview["upgraded"] is True
    assert preview["discount_amount"] == subtotal * 2 // 100

    order = client.post("/orders", json=order_payload(product, quantity=quantity), headers=session["headers"]).json()
    assert order["membership_tier"] == "silver"
    assert order["discount_percent"] == 2
    assert order["discount_amount"] == subtotal * 2 // 100
    assert order["total_amount"] == subtotal + 30000 - order["discount_amount"]

    before = client.get("/account/membership", headers=session["headers"]).json()
    assert before["total_spent"] == 0
    assert before["tier"]["code"] == "member"

    completed = client.put(f"/admin/orders/{order['id']}/status", json={"status": "completed"}, headers=admin_headers())
    assert completed.status_code == 200, completed.text
    assert completed.json()["payment_status"] == "paid"

    after = client.get("/account/membership", headers=session["headers"]).json()
    assert after["total_spent"] == order["total_amount"]
    assert after["tier"]["code"] == "silver"
    assert after["next_tier"]["code"] == "gold"
    assert after["amount_to_next"] == 2000000 - order["total_amount"]

    small = client.get("/account/membership/preview", params={"subtotal": 100000}, headers=session["headers"]).json()
    assert small["applied_tier"]["code"] == "silver"
    assert small["upgraded"] is False
    assert small["discount_amount"] == 2000


def test_kich_ban_7_doi_mat_khau():
    session = register_customer()
    wrong = client.post(
        "/account/change-password",
        headers=session["headers"],
        json={"current_password": "khongdung", "new_password": "matkhaumoi1"},
    )
    assert wrong.status_code == 400
    short = client.post(
        "/account/change-password",
        headers=session["headers"],
        json={"current_password": PASSWORD, "new_password": "1234567"},
    )
    assert short.status_code == 400

    changed = client.post(
        "/account/change-password",
        headers=session["headers"],
        json={"current_password": PASSWORD, "new_password": "matkhaumoi1"},
    )
    assert changed.status_code == 200, changed.text

    email = session["user"]["email"]
    assert client.post("/account/login", json={"identifier": email, "password": PASSWORD}).status_code == 401
    assert client.post("/account/login", json={"identifier": email, "password": "matkhaumoi1"}).status_code == 200


def test_kich_ban_7_quen_mat_khau_va_lien_ket_het_han_sau_15_phut():
    session = register_customer()
    user_id = session["user"]["id"]
    email = session["user"]["email"]

    assert client.post("/account/forgot-password", json={"email": email}).status_code == 200
    stored = run_sql(
        "SELECT password_reset_token_hash, TIMESTAMPDIFF(SECOND, NOW(), password_reset_expires_at) AS seconds_left "
        "FROM users WHERE id = %s",
        (user_id,),
    )[0]
    assert stored["password_reset_token_hash"]
    assert 14 * 60 < stored["seconds_left"] <= 15 * 60

    token = AccountService().create_reset_token(user_id)
    assert client.get("/account/reset-password/validate", params={"token": token}).json()["valid"] is True

    run_sql(
        "UPDATE users SET password_reset_expires_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE id = %s",
        (user_id,),
    )
    assert client.get("/account/reset-password/validate", params={"token": token}).json()["valid"] is False
    expired = client.post("/account/reset-password", json={"token": token, "new_password": "matkhaumoi2"})
    assert expired.status_code == 400
    assert client.post("/account/login", json={"identifier": email, "password": PASSWORD}).status_code == 200

    fresh_token = AccountService().create_reset_token(user_id)
    reset = client.post("/account/reset-password", json={"token": fresh_token, "new_password": "matkhaumoi2"})
    assert reset.status_code == 200, reset.text
    assert client.post("/account/login", json={"identifier": email, "password": "matkhaumoi2"}).status_code == 200
    assert client.post("/account/login", json={"identifier": email, "password": PASSWORD}).status_code == 401

    reused = client.post("/account/reset-password", json={"token": fresh_token, "new_password": "matkhaumoi3"})
    assert reused.status_code == 400

    hashed = run_sql("SELECT password FROM users WHERE id = %s", (user_id,))[0]["password"]
    assert hashed.startswith("$2")


def test_quen_mat_khau_email_khong_ton_tai_van_tra_thanh_cong():
    response = client.post("/account/forgot-password", json={"email": "khongtontai@example.com"})
    assert response.status_code == 200


def test_kich_ban_8_khach_vang_lai_dat_hang_khong_dang_nhap():
    product = pick_product()
    stock_before = product["stock"]

    cod = client.post("/orders", json=order_payload(product, quantity=2))
    assert cod.status_code == 200, cod.text
    order = cod.json()
    assert order["user_id"] is None
    assert order["discount_amount"] == 0
    assert order["total_amount"] == product["price"] * 2 + 30000
    assert order["status"] == "pending"

    stock_after = run_sql("SELECT stock FROM products WHERE id = %s", (product["id"],))[0]["stock"]
    assert stock_after == stock_before - 2

    vnpay = client.post("/orders/", json=order_payload(product, payment_method="vnpay"))
    assert vnpay.status_code == 200, vnpay.text
    callback = client.get("/vnpay/return", params=vnpay_return_params(vnpay.json()["payment_url"]))
    assert callback.json()["order"]["payment_status"] == "paid"


def test_dat_hang_vuot_ton_kho_bi_tu_choi_va_khong_tru_kho():
    product = pick_product()
    response = client.post("/orders", json=order_payload(product, quantity=product["stock"] + 1))
    assert response.status_code == 400
    stock_after = run_sql("SELECT stock FROM products WHERE id = %s", (product["id"],))[0]["stock"]
    assert stock_after == product["stock"]


def test_cac_trang_tai_khoan_yeu_cau_dang_nhap():
    for path in ["/account/me", "/account/orders", "/account/membership"]:
        assert client.get(path).status_code in {401, 403}


def test_quan_tri_doi_soat_theo_ma_giao_dich_va_hoan_tien():
    session = register_customer()
    order = client.post(
        "/orders", json=order_payload(pick_product(), payment_method="vnpay"), headers=session["headers"]
    ).json()
    headers = admin_headers()

    found = client.get("/admin/orders", params={"q": order["vnpay_txn_ref"]}, headers=headers).json()
    assert found["total"] == 1
    assert found["data"][0]["id"] == order["id"]
    assert found["data"][0]["transactions"][0]["txn_ref"] == order["vnpay_txn_ref"]

    pending = client.get("/admin/orders", params={"payment_status": "pending", "page_size": 100}, headers=headers).json()
    assert order["id"] in [row["id"] for row in pending["data"]]

    confirmed = client.put(f"/admin/orders/{order['id']}/payment", json={"payment_status": "paid"}, headers=headers)
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["payment_status"] == "paid"
    assert client.get(f"/account/orders/{order['id']}", headers=session["headers"]).json()["payment_status"] == "paid"

    refunded = client.put(f"/admin/orders/{order['id']}/payment", json={"payment_status": "refunded"}, headers=headers)
    assert refunded.json()["payment_status"] == "refunded"
    assert client.get("/account/membership", headers=session["headers"]).json()["total_spent"] == 0

    invalid = client.put(f"/admin/orders/{order['id']}/payment", json={"payment_status": "abc"}, headers=headers)
    assert invalid.status_code == 400


@pytest.mark.parametrize(
    "path",
    [
        "/products/",
        "/products/highlights",
        "/products/product-filter?page=1&page_size=5",
        "/products/product-filter?slug=kem-duong&min_price=100000&q=kem",
        "/categories/",
        "/brands/",
    ],
)
def test_chuc_nang_hien_co_van_hoat_dong_tren_mysql(path):
    response = client.get(path)
    assert response.status_code == 200, response.text


def test_quan_tri_tim_kiem_va_crud_tren_mysql():
    headers = admin_headers()
    categories = client.get("/admin/categories", params={"q": "kem"}, headers=headers).json()
    assert categories["total"] >= 1
    assert all("kem" in row["name"].lower() or "kem" in row["slug"] for row in categories["data"])

    brand = client.post("/admin/brands", json={"name": "Thương hiệu thử", "description": "Mô tả"}, headers=headers)
    assert brand.status_code == 200, brand.text
    brand_id = brand.json()["id"]
    assert client.get("/admin/brands", params={"q": "Thương hiệu thử"}, headers=headers).json()["total"] == 1

    slug = f"san-pham-thu-{uuid.uuid4().hex[:6]}"
    created = client.post(
        "/admin/products",
        headers=headers,
        json={
            "category_id": 1,
            "brand_id": brand_id,
            "name": "Sản phẩm thử",
            "slug": slug,
            "usage": "Thoa đều lên da",
            "price": 150000,
            "stock": 7,
            "images": ["https://example.com/a.jpg", "https://example.com/b.jpg"],
        },
    )
    assert created.status_code == 200, created.text
    product = created.json()
    assert product["images"] == ["https://example.com/a.jpg", "https://example.com/b.jpg"]
    assert product["usage"] == "Thoa đều lên da"

    by_slug = client.get(f"/products/slug/{slug}")
    assert by_slug.status_code == 200
    filtered = client.get("/admin/products", params={"q": "Sản phẩm thử", "brand_id": brand_id}, headers=headers).json()
    assert filtered["total"] == 1

    assert client.delete(f"/admin/products/{product['id']}", headers=headers).status_code == 200
    assert client.delete(f"/admin/brands/{brand_id}", headers=headers).status_code == 200

    stats = client.get("/admin/stats", headers=headers)
    assert stats.status_code == 200
    users = client.get("/admin/users", headers=headers)
    assert users.status_code == 200, users.text
