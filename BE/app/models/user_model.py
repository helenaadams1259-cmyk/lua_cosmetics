from dataclasses import dataclass


@dataclass
class User:
    id: int
    name: str
    username: str
    password: str
    is_admin: int = 0
    created_at: str | None = None
    email: str | None = None
    phone: str | None = None
    province: str | None = None
    district: str | None = None
    ward: str | None = None
    street_address: str | None = None
