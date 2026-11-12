from typing import List, Optional

from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    product_id: int
    product_name: str
    product_image: str
    product_price: int
    quantity: int
    subtotal: int


class OrderCreate(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None

    province: str
    district: str
    ward: str
    street_address: str

    payment_method: Optional[str] = "cod"

    subtotal: int
    shipping_fee: Optional[int] = 30000
    total_amount: int

    items: List[OrderItemCreate]

    callback_url: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str


class OrderPaymentStatusUpdate(BaseModel):
    payment_status: str


class RepayRequest(BaseModel):
    callback_url: Optional[str] = None


class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    province: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    street_address: Optional[str] = None

    payment_method: Optional[str] = None
    subtotal: Optional[int] = None
    shipping_fee: Optional[int] = None
    total_amount: Optional[int] = None
    status: Optional[str] = None


class AdminStats(BaseModel):
    users: int
    orders: int
    categories: int
    brands: int


class PaymentTransactionRead(BaseModel):
    id: int
    txn_ref: str
    amount: int
    status: str
    response_code: Optional[str] = None
    transaction_no: Optional[str] = None
    bank_code: Optional[str] = None
    pay_date: Optional[str] = None
    created_at: Optional[str] = None


class OrderRead(BaseModel):
    id: int
    order_code: Optional[str] = None
    user_id: Optional[int] = None

    customer_name: str
    phone: str
    email: Optional[str] = None

    province: str
    district: str
    ward: str
    street_address: str

    payment_method: str
    payment_status: str = "cod"

    subtotal: int
    shipping_fee: int
    membership_tier: Optional[str] = None
    discount_percent: int = 0
    discount_amount: int = 0
    total_amount: int

    status: str

    vnpay_txn_ref: Optional[str] = None
    vnpay_transaction_no: Optional[str] = None
    vnpay_bank_code: Optional[str] = None
    vnpay_response_code: Optional[str] = None
    vnpay_pay_date: Optional[str] = None
    paid_at: Optional[str] = None

    created_at: str
    updated_at: str

    items: List[OrderItemCreate]

    payment_url: Optional[str] = None
    txn_ref: Optional[str] = None
    transactions: Optional[List[PaymentTransactionRead]] = None

    class Config:
        from_attributes = True
