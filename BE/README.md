# LuaCosmetics - Giải thích mã nguồn

Đây là một ứng dụng FastAPI đơn giản theo kiểu phân tầng (MVC / model-service-repository). Mục tiêu của `README.md` này là giúp người mới hiểu luồng dữ liệu và các thành phần chính của dự án.

## 1. Tổng quan cấu trúc

- `app/main.py`:
  - Khởi tạo FastAPI.
  - Đăng ký các router.
  - Khởi tạo cơ sở dữ liệu khi ứng dụng khởi động.

- `app/controllers/`:
  - Chứa các route API.
  - Mỗi controller chịu trách nhiệm một nhóm tài nguyên (users, products, categories, brands, orders, admin, auth).
  - Controller chỉ nhận request, gọi service hoặc repository, rồi trả về response.

- `app/services/`:
  - Chứa logic nghiệp vụ.
  - Truy cập repository để đọc/ghi dữ liệu.
  - Xử lý hợp lệ, tạo hash mật khẩu, kiểm tra dữ liệu.

- `app/repositories/`:
  - Quản lý truy vấn vào SQLite.
  - Chứa các thao tác CRUD trực tiếp với database.
  - Trả về dữ liệu dạng dict hoặc object model.

- `app/models/`:
  - Định nghĩa cấu trúc dữ liệu nếu cần.
  - Ví dụ: `User` lưu trữ thông tin người dùng.

- `app/schemas/`:
  - Định nghĩa request/response model bằng Pydantic.
  - Giúp xác thực dữ liệu đầu vào và định dạng dữ liệu đầu ra.

- `sql/init_db.sql`:
  - Tạo bảng SQLite và dữ liệu khởi tạo.
  - Được chạy khi ứng dụng khởi động lần đầu.

## 2. Quy trình khởi động ứng dụng

1. `uvicorn app.main:app --reload` được gọi.
2. `app/main.py` tạo FastAPI instance.
3. Hàm `on_startup` trong `main.py` gọi `init_db()` từ `app/db.py`.
4. `init_db()` đọc file `sql/init_db.sql` và thực thi script để tạo bảng nếu chưa tồn tại.
5. Các router từ `app/controllers/*` được gắn vào ứng dụng.

## 3. Authentication và phân quyền

- `app/auth.py`:
  - Xác thực JWT từ header `Authorization: Bearer <token>`.
  - Giải mã token và kiểm tra username.
  - Hàm `require_admin` dùng để bảo vệ các route chỉ dành cho admin.

- `app/controllers/auth_controller.py`:
  - Cung cấp route `POST /auth/login`.
  - Trả về `access_token` khi username/password đúng.

- `app/services/auth_service.py`:
  - Tạo hash mật khẩu.
  - Kiểm tra mật khẩu.
  - Tạo JWT token.

## 4. Các controller chính

### 4.1 `app/controllers/user_controller.py`

- Route:
  - `POST /users/` tạo người dùng mới.
- Gọi `UserService` để tạo người dùng.
- `UserService` kiểm tra username tồn tại và hash mật khẩu.

### 4.2 `app/controllers/category_controller.py`

- Route:
  - `GET /categories/` lấy danh sách category.
  - `GET /categories/{category_id}` lấy chi tiết category.
- Dùng `BaseService` + `CategoryRepository`.

### 4.3 `app/controllers/brand_controller.py`

- Route:
  - `GET /brands/` lấy danh sách brand.
  - `GET /brands/{brand_id}` lấy chi tiết brand.
- Dùng `BaseService` + `BrandRepository`.

### 4.4 `app/controllers/product_controller.py`

- Route:
  - `GET /products/` lấy toàn bộ sản phẩm.
  - `GET /products/highlights` lấy sản phẩm nổi bật.
  - `GET /products/slug/{slug}` lấy sản phẩm theo slug.
  - `GET /products/{slug}/{product_id}` lấy sản phẩm chi tiết.
  - `GET /products/product-filter` lọc sản phẩm theo điều kiện.
- Dùng `ProductRepository` để xử lý logic lọc và các lệnh đặc biệt.

### 4.5 `app/controllers/order_controller.py`

- Route:
  - `POST /orders/` tạo đơn hàng mới.
- Khi tạo đơn hàng, mã nguồn tự động chèn vào bảng `orders` và `order_items` trong cùng một transaction.

### 4.6 `app/controllers/admin_controller.py`

- Route admin chỉ dành cho admin, dùng `Depends(require_admin)`.
- Quản lý category/brand/product/order/user từ admin.
- Route quan trọng:
  - `GET /admin/orders` lấy danh sách đơn hàng có phân trang và kèm item.
  - `PUT /admin/orders/{order_id}` chỉnh sửa thông tin đơn hàng.
  - `PUT /admin/orders/{order_id}/status` cập nhật trạng thái đơn hàng.
  - `DELETE /admin/orders/{order_id}` xóa đơn hàng.
  - `GET /admin/stats` lấy thống kê số lượng users, orders, categories, brands.

## 5. Repository và data flow

### 5.1 `app/repositories/order_repository.py`

- `create_order(payload)`:
  - Thực hiện `BEGIN` transaction.
  - Chèn vào bảng `orders`.
  - Chèn từng item vào `order_items`.
  - Commit nếu thành công, rollback nếu lỗi.

- `get_order(order_id)`:
  - Lấy đơn hàng và gắn thêm danh sách `order_items` tương ứng.

- `list_orders_with_items(offset, limit)`:
  - Lấy danh sách đơn hàng.
  - Lấy toàn bộ item của những order đó.
  - Gộp item theo `order_id` rồi trả về.

- `update_order(order_id, payload)`:
  - Cập nhật các trường cơ bản của order.
  - Tự động cập nhật `updated_at`.

- `delete_order(order_id)`:
  - Xóa đơn hàng.
  - Nếu bảng `order_items` có `ON DELETE CASCADE`, item sẽ bị xóa cùng.

- `count_orders()`:
  - Trả về tổng số đơn hàng.

### 5.2 `BaseService` và repository dùng chung

- `app/services/base_service.py` cung cấp:
  - `create`, `list`, `count`, `get`, `update`, `delete`.
- Các service như `CategoryService`, `BrandService`, `ProductService` đều sử dụng `BaseService` với repository tương ứng.

### 5.3 `UserService`

- `count_users()` trả về số tài khoản user hiện có.
- `create_user(user_in)` kiểm tra trùng username, hash password, và thêm user.

## 6. Đây là luồng xử lý khi gọi API `POST /orders`

1. Client gửi JSON theo schema `OrderCreate`.
2. `order_controller.create_order()` gọi `OrderRepository.create_order()`.
3. `create_order()` chèn dữ liệu vào bảng `orders`.
4. Với từng item, chèn vào `order_items`.
5. Nếu thành công, trả về dữ liệu đơn hàng cùng item.
6. Kết quả trả về theo schema `OrderRead`.

## 7. Các điểm quan trọng cần chú ý

- `app/db.py` dùng SQLite và `row_factory = sqlite3.Row` để truy vấn kết quả dạng dict.
- `sql/init_db.sql` chứa lệnh tạo bảng và dữ liệu khởi tạo.
- `app/auth.py` sử dụng JWT để xác thực và `require_admin` để giới hạn quyền admin.
- `app/controllers/admin_controller.py` dùng `Depends(require_admin)` nên chỉ admin mới truy cập được.
- `OrderRepository` dùng transaction khi tạo đơn hàng để tránh dữ liệu bị dở dang.
- `ProductRepository` có các hàm lọc và highlight riêng, giúp API tìm kiếm/đánh dấu sản phẩm.

## 8. Cách chạy dự án

1. Tạo môi trường ảo:

```bash
python -m venv .venv
```

2. Kích hoạt môi trường:

- Windows:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- macOS / Linux:
  ```bash
  source .venv/bin/activate
  ```

3. Cài dependencies:

```bash
pip install -r requirements.txt
```

4. Chạy ứng dụng:

```bash
uvicorn app.main:app --reload
```

5. Truy cập API docs:

- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/redoc

## 9. Những chỗ nên mở rộng

- Cấu hình `SECRET_KEY` không nên để cứng trong mã nguồn.
- Nên thêm endpoint sửa/xóa sản phẩm và danh mục cho admin.
- Có thể thêm phân quyền chi tiết cho user thường và admin.
- Cải thiện schema để không trả về password trong response.

---

Nếu bạn muốn, tôi có thể mở rộng thêm phần `Examples` với các request/response cụ thể bằng tiếng Việt.