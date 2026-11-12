from typing import Optional

from app.db import get_connection


class AuthRepository:
    def __init__(self):
        self._conn = get_connection()

    def get_user_by_username(self, username: str) -> Optional[dict]:
        cursor = self._conn.cursor()
        cursor.execute(
            "SELECT id, name, username, password, is_admin, created_at, email, phone, "
            "province, district, ward, street_address FROM users WHERE username = %s",
            (username,),
        )
        return cursor.fetchone()
