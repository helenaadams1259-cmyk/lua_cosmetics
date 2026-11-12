import json

from app.repositories.base_repository import BaseRepository


class ProductRepository(BaseRepository):
    def __init__(self):
        super().__init__(
            "products",
            [
                "category_id",
                "brand_id",
                "name",
                "slug",
                "short_description",
                "description",
                "ingredients",
                "usage",
                "origin",
                "skin_type",
                "volume",
                "price",
                "original_price",
                "stock",
                "rating",
                "review_count",
                "discount_percent",
                "images",
                "is_featured",
                "is_best_seller",
                "is_new",
            ],
        )

    def _encode_data(self, data: dict) -> dict:
        encoded = data.copy()
        images = encoded.get("images")
        if isinstance(images, list):
            encoded["images"] = json.dumps(images)
        return encoded

    def _decode_entity(self, entity: dict) -> dict:
        decoded = entity.copy()
        images = decoded.get("images")
        if isinstance(images, str):
            try:
                decoded["images"] = json.loads(images)
            except json.JSONDecodeError:
                decoded["images"] = []
        return decoded

    def add(self, data: dict) -> dict:
        return self._decode_entity(super().add(self._encode_data(data)))

    def update(self, entity_id: int, data: dict) -> dict:
        return self._decode_entity(super().update(entity_id, self._encode_data(data)))

    def get(self, entity_id: int) -> dict:
        entity = super().get(entity_id)
        return self._decode_entity(entity) if entity else None

    def list(self, offset: int = 0, limit: int = None) -> list:
        return [self._decode_entity(entity) for entity in super().list(offset=offset, limit=limit)]

    def list_by_flag(self, flag: str, limit: int = 10) -> list:
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT * FROM {self.table} WHERE {flag} = 1 ORDER BY created_at DESC LIMIT %s",
            (limit,),
        )
        rows = cursor.fetchall()
        return [self._decode_entity(dict(row)) for row in rows]

    def list_newest(self, limit: int = 10) -> list:
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT * FROM {self.table} ORDER BY created_at DESC LIMIT %s",
            (limit,),
        )
        rows = cursor.fetchall()
        return [self._decode_entity(dict(row)) for row in rows]

    def get_by_slug(self, slug: str) -> dict:
        cursor = self._conn.cursor()
        cursor.execute(
            f"SELECT * FROM {self.table} WHERE slug = %s LIMIT 1",
            (slug,),
        )
        row = cursor.fetchone()
        return self._decode_entity(dict(row)) if row else None

    def search_admin_products(self, q: str = None, category_id: int = None, brand_id: int = None, offset: int = 0, limit: int = None) -> list:
        cursor = self._conn.cursor()
        base = f"SELECT * FROM {self.table}"
        wheres = []
        params: list = []

        if q and q.strip():
            wheres.append("(name LIKE %s OR slug LIKE %s)")
            pattern = f"%{q.strip()}%"
            params.extend([pattern, pattern])

        if category_id is not None:
            wheres.append("category_id = %s")
            params.append(category_id)

        if brand_id is not None:
            wheres.append("brand_id = %s")
            params.append(brand_id)

        query = base
        if wheres:
            query += " WHERE " + " AND ".join(wheres)

        query += " ORDER BY created_at DESC"
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
        return [self._decode_entity(dict(row)) for row in rows]

    def count_search_admin_products(self, q: str = None, category_id: int = None, brand_id: int = None) -> int:
        cursor = self._conn.cursor()
        base = f"SELECT COUNT(*) AS total FROM {self.table}"
        wheres = []
        params: list = []

        if q and q.strip():
            wheres.append("(name LIKE %s OR slug LIKE %s)")
            pattern = f"%{q.strip()}%"
            params.extend([pattern, pattern])

        if category_id is not None:
            wheres.append("category_id = %s")
            params.append(category_id)

        if brand_id is not None:
            wheres.append("brand_id = %s")
            params.append(brand_id)

        query = base
        if wheres:
            query += " WHERE " + " AND ".join(wheres)

        cursor.execute(query, tuple(params))
        row = cursor.fetchone()
        return int(row["total"]) if row else 0

    def filter_products(
        self,
        slug: str = None,
        min_price: int = None,
        max_price: int = None,
        brands: list = None,
        q: str = None,
        offset: int = 0,
        limit: int = None,
    ) -> list:
        cursor = self._conn.cursor()
        base = f"SELECT p.* FROM {self.table} p"
        joins = []
        wheres = []
        params: list = []

        if slug:
            joins.append("JOIN categories c ON p.category_id = c.id")
            wheres.append("c.slug = %s")
            params.append(slug)

        if q and q.strip():
            wheres.append("(p.name LIKE %s OR p.slug LIKE %s)")
            pattern = f"%{q.strip()}%"
            params.extend([pattern, pattern])

        if min_price is not None:
            wheres.append("p.price >= %s")
            params.append(min_price)

        if max_price is not None:
            wheres.append("p.price <= %s")
            params.append(max_price)

        if brands:
            placeholders = ",".join(["%s" for _ in brands])
            wheres.append(f"p.brand_id IN ({placeholders})")
            params.extend(brands)

        query = " ".join([base] + joins)
        if wheres:
            query += " WHERE " + " AND ".join(wheres)

        query += " ORDER BY p.created_at DESC"
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
        return [self._decode_entity(dict(row)) for row in rows]

    def count_filtered(
        self,
        slug: str = None,
        min_price: int = None,
        max_price: int = None,
        brands: list = None,
        q: str = None,
    ) -> int:
        cursor = self._conn.cursor()
        base = f"SELECT COUNT(*) AS total FROM {self.table} p"
        joins = []
        wheres = []
        params: list = []

        if slug:
            joins.append("JOIN categories c ON p.category_id = c.id")
            wheres.append("c.slug = %s")
            params.append(slug)

        if q and q.strip():
            wheres.append("(p.name LIKE %s OR p.slug LIKE %s)")
            pattern = f"%{q.strip()}%"
            params.extend([pattern, pattern])

        if min_price is not None:
            wheres.append("p.price >= %s")
            params.append(min_price)

        if max_price is not None:
            wheres.append("p.price <= %s")
            params.append(max_price)

        if brands:
            placeholders = ",".join(["%s" for _ in brands])
            wheres.append(f"p.brand_id IN ({placeholders})")
            params.extend(brands)

        query = " ".join([base] + joins)
        if wheres:
            query += " WHERE " + " AND ".join(wheres)

        cursor.execute(query, tuple(params))
        row = cursor.fetchone()
        return int(row["total"]) if row else 0
