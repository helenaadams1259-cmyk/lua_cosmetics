import hashlib
import os
import re
import secrets
from typing import Optional

from app.models.user_model import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.mail_service import send_password_reset_mail
from app.services.membership_service import MembershipService

MIN_PASSWORD_LENGTH = 8
RESET_TOKEN_MINUTES = 15
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_PATTERN = re.compile(r"^0\d{9}$")


class AccountError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def default_reset_url() -> str:
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080").rstrip("/")
    return f"{frontend_url}/dat-lai-mat-khau"


class AccountService:
    def __init__(self):
        self._users = UserRepository()
        self._auth = AuthService()
        self._membership = MembershipService()

    def _validate_password(self, password: str) -> None:
        if len(password or "") < MIN_PASSWORD_LENGTH:
            raise AccountError(f"Mật khẩu phải có tối thiểu {MIN_PASSWORD_LENGTH} ký tự")

    def _validate_phone(self, phone: str, current_user_id: Optional[int] = None) -> str:
        phone = (phone or "").strip()
        if not PHONE_PATTERN.match(phone):
            raise AccountError("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)")
        owner = self._users.get_by_phone(phone)
        if owner is not None and owner.id != current_user_id:
            raise AccountError("Số điện thoại đã được sử dụng cho tài khoản khác")
        return phone

    def to_account(self, user: User | dict) -> dict:
        data = user if isinstance(user, dict) else user.__dict__
        return {
            "id": data["id"],
            "name": data["name"],
            "email": data.get("email"),
            "phone": data.get("phone"),
            "province": data.get("province"),
            "district": data.get("district"),
            "ward": data.get("ward"),
            "street_address": data.get("street_address"),
            "created_at": data.get("created_at"),
            "membership": self._membership.summary(data["id"]),
        }

    def _session(self, user: User) -> dict:
        return {
            "access_token": self._auth.create_customer_token(user.username),
            "token_type": "bearer",
            "user": self.to_account(user),
        }

    def register(self, name: str, email: str, phone: str, password: str) -> dict:
        name = (name or "").strip()
        email = (email or "").strip().lower()
        if not name:
            raise AccountError("Vui lòng nhập họ và tên")
        if not EMAIL_PATTERN.match(email):
            raise AccountError("Email không hợp lệ")
        self._validate_password(password)
        if self._users.get_by_email(email) is not None or self._users.get_by_username(email) is not None:
            raise AccountError("Email đã được sử dụng cho tài khoản khác")
        phone = self._validate_phone(phone)

        user = self._users.add(
            User(
                id=0,
                name=name,
                username=email,
                password=self._auth.get_password_hash(password),
                is_admin=0,
                email=email,
                phone=phone,
            )
        )
        return self._session(user)

    def login(self, identifier: str, password: str) -> dict:
        identifier = (identifier or "").strip()
        user = self._users.get_by_login_identifier(identifier) or self._users.get_by_login_identifier(identifier.lower())
        if user is None or user.is_admin or not self._auth.verify_password(password or "", user.password):
            raise AccountError("Email/số điện thoại hoặc mật khẩu không đúng", 401)
        return self._session(user)

    def update_profile(self, user_id: int, data: dict) -> dict:
        name = (data.get("name") or "").strip()
        if not name:
            raise AccountError("Vui lòng nhập họ và tên")
        phone = self._validate_phone(data.get("phone"), current_user_id=user_id)
        updated = self._users.update(
            user_id,
            {
                "name": name,
                "phone": phone,
                "province": (data.get("province") or "").strip() or None,
                "district": (data.get("district") or "").strip() or None,
                "ward": (data.get("ward") or "").strip() or None,
                "street_address": (data.get("street_address") or "").strip() or None,
            },
        )
        return self.to_account(updated)

    def change_password(self, user_id: int, current_password: str, new_password: str) -> None:
        user = self._users.get(user_id)
        if user is None or not self._auth.verify_password(current_password or "", user.password):
            raise AccountError("Mật khẩu hiện tại không đúng")
        self._validate_password(new_password)
        if current_password == new_password:
            raise AccountError("Mật khẩu mới phải khác mật khẩu hiện tại")
        self._users.update(user_id, {"password": self._auth.get_password_hash(new_password)})

    def create_reset_token(self, user_id: int) -> str:
        token = secrets.token_urlsafe(32)
        self._users.save_password_reset_token(user_id, hash_reset_token(token), RESET_TOKEN_MINUTES)
        return token

    def request_password_reset(self, email: str, reset_url: Optional[str] = None) -> None:
        email = (email or "").strip().lower()
        if not EMAIL_PATTERN.match(email):
            raise AccountError("Email không hợp lệ")
        user = self._users.get_by_email(email)
        if user is None or user.is_admin:
            return
        token = self.create_reset_token(user.id)
        base_url = reset_url if reset_url and reset_url.startswith(("http://", "https://")) else default_reset_url()
        reset_link = f"{base_url}?token={token}"
        sent = send_password_reset_mail(email, user.name, reset_link, RESET_TOKEN_MINUTES)
        if not sent:
            print(f"[MAIL] Liên kết đặt lại mật khẩu cho {email}: {reset_link}")

    def reset_password(self, token: str, new_password: str) -> None:
        self._validate_password(new_password)
        user = self._users.get_by_valid_reset_token(hash_reset_token(token or ""))
        if user is None:
            raise AccountError("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")
        self._users.update(user.id, {"password": self._auth.get_password_hash(new_password)})
        self._users.clear_password_reset_token(user.id)

    def is_reset_token_valid(self, token: str) -> bool:
        return self._users.get_by_valid_reset_token(hash_reset_token(token or "")) is not None
