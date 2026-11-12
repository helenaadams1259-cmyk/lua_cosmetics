import unittest

from app.repositories.brand_repository import BrandRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.product_repository import ProductRepository
from app.services.product_import_service import build_bulk_import_template, parse_products_from_csv_bytes


class FixedListRepository:
    def __init__(self, rows):
        self._rows = rows

    def list(self):
        return self._rows


class BulkProductImportTests(unittest.TestCase):
    def test_parse_products_from_csv(self):
        payload = (
            "category_id,name,slug,price,images\n"
            "1,Test Product,test-product,100000,img1.jpg;img2.jpg\n"
        ).encode("utf-8")

        result = parse_products_from_csv_bytes(payload, "products.csv")

        self.assertEqual(result["imported_rows"], 1)
        self.assertEqual(result["products"][0]["product"]["name"], "Test Product")
        self.assertEqual(result["products"][0]["product"]["images"], ["img1.jpg", "img2.jpg"])

    def test_parse_products_from_csv_with_optional_fields(self):
        payload = (
            "category_id,name,slug,price,stock,rating\n"
            "2,Another Product,another-product,50000,10,4.8\n"
        ).encode("utf-8")

        result = parse_products_from_csv_bytes(payload, "products.csv")

        self.assertEqual(result["imported_rows"], 1)
        self.assertEqual(result["products"][0]["product"]["slug"], "another-product")
        self.assertEqual(result["products"][0]["product"]["stock"], 10)
        self.assertEqual(result["products"][0]["product"]["rating"], 4.8)


class BulkImportTemplateTests(unittest.TestCase):
    def test_sample_template_imports_successfully_with_seeded_lookup_values(self):
        category_repo = FixedListRepository([{"id": 1, "name": "Sữa rửa mặt", "slug": "sua-rua-mat"}])
        brand_repo = FixedListRepository([{"id": 1, "name": "Lua Cosmetics"}])

        template = build_bulk_import_template()
        result = parse_products_from_csv_bytes(template, "products.csv", category_repo=category_repo, brand_repo=brand_repo)

        self.assertEqual(result["failed_rows"], 0)
        self.assertEqual(result["total_rows"], 1)
        self.assertEqual(result["imported_rows"], 1)
        self.assertEqual(result["products"][0]["product"]["category_id"], 1)
        self.assertEqual(result["products"][0]["product"]["brand_id"], 1)
        self.assertEqual(result["products"][0]["product"]["usage"], "Apply to wet skin, massage gently, then rinse.")
        self.assertEqual(result["products"][0]["product"]["images"], [
            "https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
        ])

    def test_images_column_is_supported_in_csv(self):
        payload = (
            "name,slug,category_id,brand_id,price,images\n"
            "Test Product,test-product,1,1,100000,https://a.com/img1.jpg|https://a.com/img2.jpg\n"
        ).encode("utf-8")

        result = parse_products_from_csv_bytes(payload, "products.csv")

        self.assertEqual(result["imported_rows"], 1)
        self.assertEqual(result["products"][0]["product"]["images"], ["https://a.com/img1.jpg", "https://a.com/img2.jpg"])
        self.assertEqual(result["products"][0]["product"]["is_featured"], 1)
        self.assertEqual(result["products"][0]["product"]["is_best_seller"], 1)
        self.assertEqual(result["products"][0]["product"]["is_new"], 0)
