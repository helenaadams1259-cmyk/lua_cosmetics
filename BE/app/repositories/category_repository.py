from app.repositories.base_repository import BaseRepository


class CategoryRepository(BaseRepository):
    def __init__(self):
        super().__init__("categories", ["name", "slug", "description", "image"])

    def search_admin(self, q: str = None, offset: int = 0, limit: int = None) -> list:
        cursor = self._conn.cursor()
        base = "SELECT * FROM categories"
        wheres = []
        params: list = []

        if q and q.strip():
            wheres.append("(name LIKE %s OR slug LIKE %s OR description LIKE %s)")
            pattern = f"%{q.strip()}%"
            params.extend([pattern, pattern, pattern])

        query = base
        if wheres:
            query += " WHERE " + " AND ".join(wheres)

        query += " ORDER BY id DESC"
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
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

    def count_search_admin(self, q: str = None) -> int:
        cursor = self._conn.cursor()
        base = "SELECT COUNT(*) AS total FROM categories"
        wheres = []
        params: list = []

        if q and q.strip():
            wheres.append("(name LIKE %s OR slug LIKE %s OR description LIKE %s)")
            pattern = f"%{q.strip()}%"
            params.extend([pattern, pattern, pattern])

        query = base
        if wheres:
            query += " WHERE " + " AND ".join(wheres)

        cursor.execute(query, tuple(params))
        row = cursor.fetchone()
        return int(row["total"]) if row else 0
