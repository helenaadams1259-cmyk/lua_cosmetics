import os
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from jose import jwt

from app.repositories.auth_repository import AuthRepository
from app.schemas.auth_schema import UserLogin

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
CUSTOMER_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7


class AuthService:
    def __init__(self):
        self._repo = AuthRepository()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
        except ValueError:
            return False

    def get_password_hash(self, password: str) -> str:
        return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    def authenticate_user(self, login_data: UserLogin) -> Optional[dict]:
        user = self._repo.get_user_by_username(login_data.username)
        if not user:
            return None
        if not self.verify_password(login_data.password, user["password"]):
            return None
        return user

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    def create_customer_token(self, username: str) -> str:
        return self.create_access_token(
            {"sub": username, "is_admin": 0},
            timedelta(minutes=CUSTOMER_TOKEN_EXPIRE_MINUTES),
        )
