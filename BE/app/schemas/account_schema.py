from typing import List, Optional

from pydantic import BaseModel


class AccountRegister(BaseModel):
    name: str
    email: str
    phone: str
    password: str


class AccountLogin(BaseModel):
    identifier: str
    password: str


class AccountUpdate(BaseModel):
    name: str
    phone: str
    province: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    street_address: Optional[str] = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


class ForgotPassword(BaseModel):
    email: str
    reset_url: Optional[str] = None


class ResetPassword(BaseModel):
    token: str
    new_password: str


class MembershipTier(BaseModel):
    code: str
    name: str
    min_spent: int
    discount_percent: int


class MembershipSummary(BaseModel):
    total_spent: int
    tier: MembershipTier
    next_tier: Optional[MembershipTier] = None
    amount_to_next: int
    progress_percent: int
    tiers: List[MembershipTier]


class MembershipPreview(BaseModel):
    total_spent: int
    current_tier: MembershipTier
    applied_tier: MembershipTier
    upgraded: bool
    discount_percent: int
    discount_amount: int
    subtotal: int
    shipping_fee: int
    total_amount: int


class AccountRead(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    street_address: Optional[str] = None
    created_at: Optional[str] = None
    membership: MembershipSummary


class AccountSession(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AccountRead
