from typing import List, Optional

from app.models.user_model import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserCreate
from app.services.auth_service import AuthService


class UserService:
    def __init__(self):
        self._repo = UserRepository()
        self._auth_service = AuthService()

    def create_user(self, user_in: UserCreate) -> User:
        existing_user = self._repo.get_by_username(user_in.username)
        if existing_user is not None:
            raise ValueError("Username already exists")

        hashed_password = self._auth_service.get_password_hash(user_in.password)
        user = User(
            id=0,
            name=user_in.name,
            username=user_in.username,
            password=hashed_password,
            is_admin=1 if user_in.is_admin else 0,
        )
        return self._repo.add(user)

    def get_users(self, offset: int = 0, limit: Optional[int] = None) -> List[User]:
        return self._repo.list(offset=offset, limit=limit)

    def count_users(self) -> int:
        return self._repo.count()

    def get_user(self, user_id: int) -> Optional[User]:
        return self._repo.get(user_id)

    def update_user(self, user_id: int, user_in: UserCreate) -> Optional[User]:
        existing_user = self._repo.get_by_username(user_in.username)
        if existing_user is not None and existing_user.id != user_id:
            raise ValueError("Username already exists")

        updated_data = {
            "name": user_in.name,
            "username": user_in.username,
            "password": self._auth_service.get_password_hash(user_in.password),
            "is_admin": 1 if user_in.is_admin else 0,
        }
        return self._repo.update(user_id, updated_data)

    def delete_user(self, user_id: int) -> bool:
        return self._repo.delete(user_id)
