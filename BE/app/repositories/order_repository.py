from typing import Callable, Dict, List, Optional

from app.db import UNLIMITED_ROWS, get_connection

ORDER_UPDATABLE_FIELDS = [
    "customer_name",
    "phone",
    "email",
    "province",
    "district",
    "ward",
    "street_address",
    "payment_method",
    "subtotal",
    "shipping_fee",
    "total_amount",
    "status",
]

SPENT_CONDITION = "status <> 'cancelled' AND (payment_status = 'paid' OR status = 'completed')"


def build_order_code(order: Dict) -> str:
    created_at = str(order.get("created_at") or "")
    date_part = created_at[2:10].replace("-", "") if len(created_at) >= 10 else "000000"
    return f"LC{date_part}-{int(order['id']):04d}"


class OrderRepository:

    def __init__(self):
        self._conn = get_connection()

    def create_order(
        self,
        payload: Dict,
        user_id: Optional[int] = None,
        discount_calculator: Optional[Callable[[int, int, int], Dict]] = None,
        vnpay_txn_ref: Optional[str] = None,
    ) -> Dict:
        items = payload.get("items") or []
        if not items:
            raise ValueError("Order must contain at least one item")

        payment_method = (payload.get("payment_method") or "cod").lower()
        shipping_fee = int(payload.get("shipping_fee") if payload.get("shipping_fee") is not None else 30000)

        self._conn.begin()
        cursor = self._conn.cursor()
        try:
            order_items = []
            for it in items:
                product_id = it.get("product_id")
                quantity = it.get("quantity") or 0

                if product_id is None:
                    raise ValueError("Each item must include a product_id")
                if quantity <= 0:
                    raise ValueError("Quantity must be greater than zero")

                cursor.execute(
                    "SELECT stock, price FROM products WHERE id = %s FOR UPDATE",
                    (product_id,),
                )
                product_row = cursor.fetchone()
                if not product_row:
                    raise ValueError("Product not found")
                if quantity > int(product_row["stock"]):
                    raise ValueError("The requested quantity exceeds the available stock.")

                cursor.execute(
                    "UPDATE products SET stock = stock - %s WHERE id = %s AND stock >= %s",
                    (quantity, product_id, quantity),
                )
                if cursor.rowcount != 1:
                    raise ValueError("The requested quantity exceeds the available stock.")

                unit_price = int(product_row["price"])
                order_items.append(
                    {
                        "product_id": product_id,
                        "product_name": it.get("product_name"),
                        "product_image": it.get("product_image") or "",
                        "product_price": unit_price,
                        "quantity": quantity,
                        "subtotal": unit_price * quantity,
                    }
                )

            subtotal = sum(item["subtotal"] for item in order_items)
            membership_tier = None
            discount_percent = 0
            discount_amount = 0
            if user_id is not None and discount_calculator is not None:
                cursor.execute(
                    f"SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE user_id = %s AND {SPENT_CONDITION}",
                    (user_id,),
                )
                total_spent = int(cursor.fetchone()["total"] or 0)
                discount = discount_calculator(total_spent, subtotal, shipping_fee)
                membership_tier = discount["applied_tier"]["code"]
                discount_percent = discount["discount_percent"]
                discount_amount = discount["discount_amount"]

            total_amount = subtotal + shipping_fee - discount_amount
            payment_status = "pending" if payment_method == "vnpay" else "cod"

            cursor.execute(
                """
                INSERT INTO orders (
                    user_id, customer_name, phone, email,
                    province, district, ward, street_address,
                    payment_method, payment_status,
                    subtotal, shipping_fee,
                    membership_tier, discount_percent, discount_amount,
                    total_amount, status, vnpay_txn_ref
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    payload.get("customer_name"),
                    payload.get("phone"),
                    payload.get("email") or None,
                    payload.get("province"),
                    payload.get("district"),
                    payload.get("ward"),
                    payload.get("street_address"),
                    payment_method,
                    payment_status,
                    subtotal,
                    shipping_fee,
                    membership_tier,
                    discount_percent,
                    discount_amount,
                    total_amount,
                    "pending",
                    vnpay_txn_ref if payment_method == "vnpay" else None,
                ),
            )
            order_id = cursor.lastrowid

            for item in order_items:
                cursor.execute(
                    """
                    INSERT INTO order_items (
                        order_id, product_id, product_name, product_image,
                        product_price, quantity, subtotal
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        order_id,
                        item["product_id"],
                        item["product_name"],
                        item["product_image"],
                        item["product_price"],
                        item["quantity"],
                        item["subtotal"],
                    ),
                )

            if payment_method == "vnpay" and vnpay_txn_ref:
                cursor.execute(
                    "INSERT INTO payment_transactions (order_id, txn_ref, amount, status) VALUES (%s, %s, %s, 'pending')",
                    (order_id, vnpay_txn_ref, total_amount),
                )

            self._conn.commit()
            return self.get_order(order_id)
        except Exception:
            self._conn.rollback()
            raise

    def _attach_items(self, orders: List[Dict]) -> List[Dict]:
        if not orders:
            return []
        order_ids = [order["id"] for order in orders]
        placeholders = ",".join(["%s" for _ in order_ids])
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT * FROM order_items WHERE order_id IN ({placeholders}) ORDER BY id",
            tuple(order_ids),
        )
        items_by_order: Dict[int, List[Dict]] = {}
        for item in cursor.fetchall():
            items_by_order.setdefault(item["order_id"], []).append(item)
        for order in orders:
            order["items"] = items_by_order.get(order["id"], [])
            order["order_code"] = build_order_code(order)
        return orders

    def get_order(self, order_id: int) -> Optional[Dict]:
        cursor = self._conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return self._attach_items([row])[0]

    def get_order_for_user(self, order_id: int, user_id: int) -> Optional[Dict]:
        order = self.get_order(order_id)
        if not order or order.get("user_id") != user_id:
            return None
        return order

    def get_order_by_txn_ref(self, txn_ref: str) -> Optional[Dict]:
        cursor = self._conn.cursor()
        cursor.execute("SELECT order_id FROM payment_transactions WHERE txn_ref = %s", (txn_ref,))
        row = cursor.fetchone()
        if not row:
            return None
        return self.get_order(row["order_id"])

    def list_transactions(self, order_id: int) -> List[Dict]:
        cursor = self._conn.cursor()
        cursor.execute(
            "SELECT * FROM payment_transactions WHERE order_id = %s ORDER BY id DESC",
            (order_id,),
        )
        return list(cursor.fetchall())

    def get_transaction(self, txn_ref: str) -> Optional[Dict]:
        cursor = self._conn.cursor()
        cursor.execute("SELECT * FROM payment_transactions WHERE txn_ref = %s", (txn_ref,))
        return cursor.fetchone()

    def start_payment_attempt(self, order_id: int, txn_ref: str, amount: int) -> None:
        cursor = self._conn.cursor()
        cursor.execute(
            "INSERT INTO payment_transactions (order_id, txn_ref, amount, status) VALUES (%s, %s, %s, 'pending')",
            (order_id, txn_ref, amount),
        )
        cursor.execute(
            "UPDATE orders SET vnpay_txn_ref = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (txn_ref, order_id),
        )
        self._conn.commit()

    def record_payment_result(self, txn_ref: str, success: bool, result: Dict) -> Optional[Dict]:
        self._conn.begin()
        cursor = self._conn.cursor()
        try:
            cursor.execute(
                "SELECT * FROM payment_transactions WHERE txn_ref = %s FOR UPDATE",
                (txn_ref,),
            )
            transaction = cursor.fetchone()
            if not transaction:
                self._conn.rollback()
                return None
            order_id = transaction["order_id"]

            if transaction["status"] != "success":
                cursor.execute(
                    """
                    UPDATE payment_transactions
                    SET status = %s, response_code = %s, transaction_no = %s,
                        bank_code = %s, pay_date = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE txn_ref = %s
                    """,
                    (
                        "success" if success else "failed",
                        result.get("response_code"),
                        result.get("transaction_no"),
                        result.get("bank_code"),
                        result.get("pay_date"),
                        txn_ref,
                    ),
                )

            if success:
                cursor.execute(
                    """
                    UPDATE orders
                    SET payment_status = 'paid',
                        paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP),
                        vnpay_txn_ref = %s,
                        vnpay_transaction_no = %s,
                        vnpay_bank_code = %s,
                        vnpay_response_code = %s,
                        vnpay_pay_date = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND payment_status <> 'refunded'
                    """,
                    (
                        txn_ref,
                        result.get("transaction_no"),
                        result.get("bank_code"),
                        result.get("response_code"),
                        result.get("pay_date"),
                        order_id,
                    ),
                )
            else:
                cursor.execute(
                    """
                    UPDATE orders
                    SET vnpay_response_code = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND payment_status = 'pending'
                    """,
                    (result.get("response_code"), order_id),
                )

            self._conn.commit()
            return self.get_order(order_id)
        except Exception:
            self._conn.rollback()
            raise

    def set_payment_status(self, order_id: int, payment_status: str) -> Optional[Dict]:
        cursor = self._conn.cursor()
        if payment_status == "paid":
            cursor.execute(
                """
                UPDATE orders
                SET payment_status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (order_id,),
            )
        else:
            cursor.execute(
                "UPDATE orders SET payment_status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (payment_status, order_id),
            )
        self._conn.commit()
        return self.get_order(order_id)

    def update_status(self, order_id: int, status: str) -> Optional[Dict]:
        cursor = self._conn.cursor()
        cursor.execute(
            "UPDATE orders SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (status, order_id),
        )
        if status == "completed":
            cursor.execute(
                """
                UPDATE orders
                SET payment_status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP)
                WHERE id = %s AND payment_method = 'cod' AND payment_status = 'cod'
                """,
                (order_id,),
            )
        self._conn.commit()
        return self.get_order(order_id)

    def update_order(self, order_id: int, payload: Dict) -> Optional[Dict]:
        fields = []
        values = []
        for key in ORDER_UPDATABLE_FIELDS:
            if key in payload:
                fields.append(f"{key} = %s")
                values.append(payload[key])

        if not fields:
            return self.get_order(order_id)

        values.append(order_id)
        cursor = self._conn.cursor()
        cursor.execute(
            f"UPDATE orders SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            tuple(values),
        )
        self._conn.commit()
        if payload.get("status") == "completed":
            return self.update_status(order_id, "completed")
        return self.get_order(order_id)

    def delete_order(self, order_id: int) -> bool:
        cursor = self._conn.cursor()
        cursor.execute("DELETE FROM orders WHERE id = %s", (order_id,))
        self._conn.commit()
        return cursor.rowcount > 0

    def _admin_filters(self, q: Optional[str], payment_status: Optional[str]) -> tuple:
        wheres = []
        params: List = []
        if q and q.strip():
            pattern = f"%{q.strip()}%"
            wheres.append(
                "(CAST(o.id AS CHAR) = %s OR o.customer_name LIKE %s OR o.phone LIKE %s "
                "OR o.vnpay_txn_ref LIKE %s OR o.vnpay_transaction_no LIKE %s "
                "OR EXISTS (SELECT 1 FROM payment_transactions t WHERE t.order_id = o.id "
                "AND (t.txn_ref LIKE %s OR t.transaction_no LIKE %s)))"
            )
            params.extend([q.strip(), pattern, pattern, pattern, pattern, pattern, pattern])
        if payment_status:
            wheres.append("o.payment_status = %s")
            params.append(payment_status)
        where_sql = f" WHERE {' AND '.join(wheres)}" if wheres else ""
        return where_sql, params

    def list_orders(
        self,
        offset: int = 0,
        limit: int = None,
        q: Optional[str] = None,
        payment_status: Optional[str] = None,
    ) -> List[Dict]:
        where_sql, params = self._admin_filters(q, payment_status)
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT o.* FROM orders o{where_sql} ORDER BY o.created_at DESC, o.id DESC LIMIT %s OFFSET %s",
            tuple(params + [limit if limit is not None else UNLIMITED_ROWS, offset or 0]),
        )
        return list(cursor.fetchall())

    def list_orders_with_items(
        self,
        offset: int = 0,
        limit: int = None,
        q: Optional[str] = None,
        payment_status: Optional[str] = None,
    ) -> List[Dict]:
        return self._attach_items(
            self.list_orders(offset=offset, limit=limit, q=q, payment_status=payment_status)
        )

    def count_orders(self, q: Optional[str] = None, payment_status: Optional[str] = None) -> int:
        where_sql, params = self._admin_filters(q, payment_status)
        cursor = self._conn.cursor()
        cursor.execute(f"SELECT COUNT(*) AS total FROM orders o{where_sql}", tuple(params))
        row = cursor.fetchone()
        return int(row["total"]) if row else 0

    def _user_filters(self, user_id: int, status_filter: Optional[str]) -> tuple:
        wheres = ["user_id = %s"]
        params: List = [user_id]
        if status_filter == "awaiting_payment":
            wheres.append("payment_method = 'vnpay' AND payment_status = 'pending' AND status <> 'cancelled'")
        elif status_filter == "processing":
            wheres.append(
                "status IN ('pending', 'confirmed') AND NOT (payment_method = 'vnpay' AND payment_status = 'pending')"
            )
        elif status_filter == "paid":
            wheres.append("payment_status = 'paid'")
        elif status_filter in {"shipping", "completed", "cancelled"}:
            wheres.append("status = %s")
            params.append(status_filter)
        return " AND ".join(wheres), params

    def list_orders_by_user(
        self,
        user_id: int,
        status_filter: Optional[str] = None,
        offset: int = 0,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        where_sql, params = self._user_filters(user_id, status_filter)
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT * FROM orders WHERE {where_sql} ORDER BY created_at DESC, id DESC LIMIT %s OFFSET %s",
            tuple(params + [limit if limit is not None else UNLIMITED_ROWS, offset or 0]),
        )
        return self._attach_items(list(cursor.fetchall()))

    def count_orders_by_user(self, user_id: int, status_filter: Optional[str] = None) -> int:
        where_sql, params = self._user_filters(user_id, status_filter)
        cursor = self._conn.cursor()
        cursor.execute(f"SELECT COUNT(*) AS total FROM orders WHERE {where_sql}", tuple(params))
        row = cursor.fetchone()
        return int(row["total"]) if row else 0

    def total_spent_by_user(self, user_id: int) -> int:
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE user_id = %s AND {SPENT_CONDITION}",
            (user_id,),
        )
        row = cursor.fetchone()
        return int(row["total"] or 0) if row else 0
