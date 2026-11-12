from typing import List, Optional

from app.db import UNLIMITED_ROWS, get_connection
from app.models.user_model import User

USER_COLUMNS = (
    "id, name, username, password, is_admin, created_at, "
    "email, phone, province, district, ward, street_address"
)


def _to_user(row: Optional[dict]) -> Optional[User]:
    if row is None:
        return None
    return User(
        id=row["id"],
        name=row["name"],
        username=row["username"],
        password=row["password"],
        is_admin=row["is_admin"],
        created_at=row["created_at"],
        email=row["email"],
        phone=row["phone"],
        province=row["province"],
        district=row["district"],
        ward=row["ward"],
        street_address=row["street_address"],
    )


class UserRepository:
    def __init__(self):
        self._conn = get_connection()

    def _fetch_one(self, where: str, params: tuple) -> Optional[User]:
        cursor = self._conn.cursor()
        cursor.execute(f"SELECT {USER_COLUMNS} FROM users WHERE {where} LIMIT 1", params)
        return _to_user(cursor.fetchone())

    def add(self, user: User) -> User:
        cursor = self._conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, username, password, is_admin, email, phone) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (user.name, user.username, user.password, user.is_admin, user.email, user.phone),
        )
        self._conn.commit()
        return self.get(cursor.lastrowid)

    def get(self, user_id: int) -> Optional[User]:
        return self._fetch_one("id = %s", (user_id,))

    def get_by_username(self, username: str) -> Optional[User]:
        return self._fetch_one("username = %s", (username,))

    def get_by_email(self, email: str) -> Optional[User]:
        return self._fetch_one("email = %s", (email,))

    def get_by_phone(self, phone: str) -> Optional[User]:
        return self._fetch_one("phone = %s AND is_admin = 0", (phone,))

    def get_by_login_identifier(self, identifier: str) -> Optional[User]:
        return self._fetch_one(
            "username = %s OR email = %s OR (phone = %s AND is_admin = 0)",
            (identifier, identifier, identifier),
        )

    def list(self, offset: int = 0, limit: Optional[int] = None) -> List[User]:
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT {USER_COLUMNS} FROM users ORDER BY id LIMIT %s OFFSET %s",
            (limit if limit is not None else UNLIMITED_ROWS, offset or 0),
        )
        return [_to_user(row) for row in cursor.fetchall()]

    def count(self) -> int:
        cursor = self._conn.cursor()
        cursor.execute("SELECT COUNT(*) AS total FROM users")
        row = cursor.fetchone()
        return int(row["total"]) if row else 0

    def update(self, user_id: int, data: dict) -> Optional[User]:
        if not data:
            return self.get(user_id)
        assignments = ", ".join([f"`{key}` = %s" for key in data.keys()])
        values = list(data.values()) + [user_id]
        cursor = self._conn.cursor()
        cursor.execute(f"UPDATE users SET {assignments} WHERE id = %s", values)
        self._conn.commit()
        return self.get(user_id)

    def delete(self, user_id: int) -> bool:
        cursor = self._conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        self._conn.commit()
        return cursor.rowcount > 0

    def save_password_reset_token(self, user_id: int, token_hash: str, minutes_valid: int) -> None:
        cursor = self._conn.cursor()
        cursor.execute(
            "UPDATE users SET password_reset_token_hash = %s, "
            "password_reset_expires_at = DATE_ADD(NOW(), INTERVAL %s MINUTE) WHERE id = %s",
            (token_hash, minutes_valid, user_id),
        )
        self._conn.commit()

    def get_by_valid_reset_token(self, token_hash: str) -> Optional[User]:
        return self._fetch_one(
            "password_reset_token_hash = %s AND password_reset_expires_at > NOW()",
            (token_hash,),
        )

    def clear_password_reset_token(self, user_id: int) -> None:
        cursor = self._conn.cursor()
        cursor.execute(
            "UPDATE users SET password_reset_token_hash = NULL, password_reset_expires_at = NULL WHERE id = %s",
            (user_id,),
        )
        self._conn.commit()
