from typing import List, Optional

from app.db import get_connection


class BaseRepository:
    def __init__(self, table: str, insert_fields: List[str]):
        self.table = table
        self.insert_fields = insert_fields
        self._conn = get_connection()

    def add(self, data: dict) -> dict:
        columns = ", ".join(f"`{field}`" for field in self.insert_fields)
        placeholders = ", ".join(["%s" for _ in self.insert_fields])
        values = [data.get(field) for field in self.insert_fields]
        cursor = self._conn.cursor()
        cursor.execute(
            f"INSERT INTO {self.table} ({columns}) VALUES ({placeholders})",
            values,
        )
        self._conn.commit()
        return self.get(cursor.lastrowid)

    def list(self, offset: int = 0, limit: Optional[int] = None) -> List[dict]:
        cursor = self._conn.cursor()
        query = f"SELECT * FROM {self.table}"
        params: List[Optional[int]] = []
        if limit is not None:
            query += " LIMIT %s"
            params.append(limit)
            if offset:
                query += " OFFSET %s"
                params.append(offset)
        elif offset:
            query += " LIMIT 18446744073709551615 OFFSET %s"
            params.append(offset)
        cursor.execute(query, tuple(params))
        return [dict(row) for row in cursor.fetchall()]

    def count(self) -> int:
        cursor = self._conn.cursor()
        cursor.execute(f"SELECT COUNT(*) AS total FROM {self.table}")
        row = cursor.fetchone()
        return int(row["total"]) if row else 0

    def get(self, entity_id: int) -> Optional[dict]:
        cursor = self._conn.cursor()
        cursor.execute(f"SELECT * FROM {self.table} WHERE id = %s", (entity_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

    def update(self, entity_id: int, data: dict) -> Optional[dict]:
        if not data:
            return self.get(entity_id)
        assignments = ", ".join([f"`{key}` = %s" for key in data.keys()])
        values = list(data.values()) + [entity_id]
        cursor = self._conn.cursor()
        cursor.execute(
            f"UPDATE {self.table} SET {assignments} WHERE id = %s",
            values,
        )
        self._conn.commit()
        return self.get(entity_id)

    def delete(self, entity_id: int) -> bool:
        cursor = self._conn.cursor()
        cursor.execute(f"DELETE FROM {self.table} WHERE id = %s", (entity_id,))
        self._conn.commit()
        return cursor.rowcount > 0
