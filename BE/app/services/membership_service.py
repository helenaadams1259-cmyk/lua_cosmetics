from typing import Optional

from app.repositories.order_repository import OrderRepository

MEMBERSHIP_TIERS = [
    {"code": "member", "name": "Thành viên", "min_spent": 0, "discount_percent": 0},
    {"code": "silver", "name": "Bạc", "min_spent": 500000, "discount_percent": 2},
    {"code": "gold", "name": "Vàng", "min_spent": 2000000, "discount_percent": 5},
    {"code": "diamond", "name": "Kim cương", "min_spent": 5000000, "discount_percent": 8},
]


def tier_for_amount(amount: int) -> dict:
    matched = MEMBERSHIP_TIERS[0]
    for tier in MEMBERSHIP_TIERS:
        if amount >= tier["min_spent"]:
            matched = tier
    return matched


def next_tier_after(tier: dict) -> Optional[dict]:
    index = MEMBERSHIP_TIERS.index(tier)
    if index + 1 < len(MEMBERSHIP_TIERS):
        return MEMBERSHIP_TIERS[index + 1]
    return None


def calculate_discount(total_spent: int, subtotal: int, shipping_fee: int) -> dict:
    current_tier = tier_for_amount(total_spent)
    applied_tier = tier_for_amount(total_spent + subtotal + shipping_fee)
    discount_amount = subtotal * applied_tier["discount_percent"] // 100
    return {
        "current_tier": current_tier,
        "applied_tier": applied_tier,
        "upgraded": applied_tier["code"] != current_tier["code"],
        "discount_percent": applied_tier["discount_percent"],
        "discount_amount": discount_amount,
        "subtotal": subtotal,
        "shipping_fee": shipping_fee,
        "total_amount": subtotal + shipping_fee - discount_amount,
    }


class MembershipService:
    def __init__(self):
        self._orders = OrderRepository()

    def total_spent(self, user_id: int) -> int:
        return self._orders.total_spent_by_user(user_id)

    def summary(self, user_id: int) -> dict:
        total_spent = self.total_spent(user_id)
        tier = tier_for_amount(total_spent)
        upcoming = next_tier_after(tier)
        if upcoming is None:
            amount_to_next = 0
            progress_percent = 100
        else:
            amount_to_next = upcoming["min_spent"] - total_spent
            span = upcoming["min_spent"] - tier["min_spent"]
            progress_percent = int((total_spent - tier["min_spent"]) * 100 / span) if span else 100
        return {
            "total_spent": total_spent,
            "tier": tier,
            "next_tier": upcoming,
            "amount_to_next": amount_to_next,
            "progress_percent": progress_percent,
            "tiers": MEMBERSHIP_TIERS,
        }

    def preview(self, user_id: int, subtotal: int, shipping_fee: int) -> dict:
        result = calculate_discount(self.total_spent(user_id), subtotal, shipping_fee)
        result["total_spent"] = self.total_spent(user_id)
        return result
