import csv
import io
import re
from typing import Any, Dict, List, Optional

from app.repositories.brand_repository import BrandRepository
from app.repositories.category_repository import CategoryRepository


def _clean_value(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _parse_int(value: Optional[str], field_name: str, errors: List[str]) -> Optional[int]:
    if value is None:
        return None
    text = _clean_value(value)
    if text is None:
        return None
    try:
        return int(text)
    except ValueError:
        errors.append(f"{field_name} must be an integer")
        return None


def _parse_float(value: Optional[str], field_name: str, errors: List[str]) -> Optional[float]:
    if value is None:
        return None
    text = _clean_value(value)
    if text is None:
        return None
    try:
        return float(text)
    except ValueError:
        errors.append(f"{field_name} must be numeric")
        return None


def _parse_boolean(value: Optional[str], field_name: str, errors: List[str]) -> Optional[int]:
    if value is None:
        return None
    text = _clean_value(value)
    if text is None:
        return None
    normalized = text.lower()
    if normalized in {"true", "1", "yes", "y"}:
        return 1
    if normalized in {"false", "0", "no", "n"}:
        return 0
    errors.append(f"{field_name} must be true/false, 1/0, or yes/no")
    return None


def _parse_image_urls(value: Optional[str]) -> List[str]:
    if value is None:
        return []
    text = _clean_value(value)
    if text is None:
        return []
    parts = re.split(r"[,|]", text)
    return [part.strip() for part in parts if part.strip()]


def _build_lookup(items: List[Dict[str, Any]]) -> Dict[int, int]:
    return {int(item["id"]): int(item["id"]) for item in items if item.get("id") is not None}


def parse_products_from_csv_bytes(
    payload: bytes | str,
    filename: str,
    category_repo: Optional[CategoryRepository] = None,
    brand_repo: Optional[BrandRepository] = None,
) -> Dict[str, Any]:
    if isinstance(payload, bytes):
        text = payload.decode("utf-8-sig")
    else:
        text = payload

    if not text or not text.strip():
        raise ValueError(f"CSV file {filename} is empty")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise ValueError(f"CSV file {filename} has no header row")

    category_repo = category_repo or CategoryRepository()
    brand_repo = brand_repo or BrandRepository()
    category_lookup = _build_lookup(category_repo.list())
    brand_lookup = _build_lookup(brand_repo.list())

    products: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []
    total_rows = 0

    for row_number, row in enumerate(reader, start=2):
        if not row or not any((_clean_value(value) or "") for value in row.values()):
            continue
        total_rows += 1

        row_errors: List[str] = []
        product_payload: Dict[str, Any] = {}

        name = _clean_value(row.get("name"))
        slug = _clean_value(row.get("slug"))
        category_id_text = _clean_value(row.get("category_id"))
        brand_id_text = _clean_value(row.get("brand_id"))
        price_text = _clean_value(row.get("price"))

        if not name:
            row_errors.append("name is required")
        if not slug:
            row_errors.append("slug is required")
        if not category_id_text:
            row_errors.append("category_id is required")
        if not price_text:
            row_errors.append("price is required")

        if category_id_text:
            category_id = _parse_int(category_id_text, "category_id", row_errors)
            if category_id is not None:
                if category_id not in category_lookup:
                    row_errors.append(f"category_id {category_id} does not exist")
                else:
                    product_payload["category_id"] = category_id

        if brand_id_text:
            brand_id = _parse_int(brand_id_text, "brand_id", row_errors)
            if brand_id is not None:
                if brand_id not in brand_lookup:
                    row_errors.append(f"brand_id {brand_id} does not exist")
                else:
                    product_payload["brand_id"] = brand_id

        if name:
            product_payload["name"] = name
        if slug:
            product_payload["slug"] = slug

        price = None
        if price_text:
            price = _parse_int(price_text, "price", row_errors)
            if price is not None:
                product_payload["price"] = price

        original_price = _parse_int(_clean_value(row.get("original_price")), "original_price", row_errors)
        if original_price is not None:
            product_payload["original_price"] = original_price

        stock = _parse_int(_clean_value(row.get("stock")), "stock", row_errors)
        if stock is not None:
            product_payload["stock"] = stock

        discount_percent = _parse_int(_clean_value(row.get("discount_percent")), "discount_percent", row_errors)
        if discount_percent is not None:
            product_payload["discount_percent"] = discount_percent

        rating = _parse_float(_clean_value(row.get("rating")), "rating", row_errors)
        if rating is not None:
            product_payload["rating"] = rating

        review_count = _parse_int(_clean_value(row.get("review_count")), "review_count", row_errors)
        if review_count is not None:
            product_payload["review_count"] = review_count

        featured = _parse_boolean(_clean_value(row.get("featured")), "featured", row_errors)
        if featured is not None:
            product_payload["is_featured"] = featured

        best_seller = _parse_boolean(_clean_value(row.get("best_seller")), "best_seller", row_errors)
        if best_seller is not None:
            product_payload["is_best_seller"] = best_seller

        new_product = _parse_boolean(_clean_value(row.get("new_product")), "new_product", row_errors)
        if new_product is not None:
            product_payload["is_new"] = new_product

        product_payload["short_description"] = _clean_value(row.get("short_description"))
        product_payload["description"] = _clean_value(row.get("description"))
        product_payload["ingredients"] = _clean_value(row.get("ingredients"))
        product_payload["usage"] = _clean_value(row.get("usage_instructions") or row.get("usage"))
        product_payload["volume"] = _clean_value(row.get("volume"))
        product_payload["origin"] = _clean_value(row.get("origin"))
        product_payload["skin_type"] = _clean_value(row.get("skin_type"))
        product_payload["images"] = _parse_image_urls(_clean_value(row.get("image_urls")))

        if row_errors:
            errors.append({"row_number": row_number, "message": "; ".join(row_errors)})
            continue

        products.append({"row_number": row_number, "product": product_payload})

    return {
        "total_rows": total_rows,
        "imported_rows": len(products),
        "failed_rows": len(errors),
        "errors": errors,
        "products": products,
    }


def build_bulk_import_template() -> str:
    headers = [
        "name",
        "slug",
        "volume",
        "category_id",
        "brand_id",
        "price",
        "original_price",
        "stock",
        "discount_percent",
        "origin",
        "skin_type",
        "rating",
        "review_count",
        "short_description",
        "description",
        "ingredients",
        "usage_instructions",
        "image_urls",
        "featured",
        "best_seller",
        "new_product",
    ]
    sample_row = {
        "name": "Hydrating Facial Cleanser",
        "slug": "hydrating-facial-cleanser",
        "volume": "150ml",
        "category_id": "1",
        "brand_id": "1",
        "price": "350000",
        "original_price": "420000",
        "stock": "120",
        "discount_percent": "17",
        "origin": "France",
        "skin_type": "Dry, Normal",
        "rating": "4.8",
        "review_count": "356",
        "short_description": "Gentle hydrating facial cleanser.",
        "description": "A daily cleanser that removes dirt and makeup without disrupting the skin barrier.",
        "ingredients": "Ceramides, Hyaluronic Acid, Glycerin",
        "usage_instructions": "Apply to wet skin, massage gently, then rinse.",
        "image_urls": "https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&w=800&q=80|https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        "featured": "1",
        "best_seller": "1",
        "new_product": "0",
    }
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers, lineterminator="\n")
    writer.writeheader()
    writer.writerow(sample_row)
    return output.getvalue()
