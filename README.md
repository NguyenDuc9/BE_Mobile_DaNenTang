Bài Tập Lớn

# BE Auth API

Backend Express cho đăng ký và đăng nhập người dùng bằng MySQL, bcrypt và JWT.

## 1. Cài đặt

```bash
npm install
```

Tạo file `.env` dựa trên cấu hình sau:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=computer_store_db
DB_TIMEZONE=+07:00
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

## 2. Chuẩn bị database

Chọn đúng database trong MySQL rồi chạy schema `roles` và `users` mà bạn đã cung cấp. API sẽ tự tạo role `USER` khi đăng ký nếu role này chưa tồn tại. Có thể tạo trước bằng:

```sql
INSERT INTO roles (name, description)
VALUES ('USER', 'Người dùng thông thường');
```

API luôn tự gán role `USER` cho tài khoản mới. Không gửi `role` từ client để tự nâng quyền.

## 3. Chạy server

```bash
npm start
```

Server chạy tại `http://localhost:8000`.

## 4. Test API bằng curl

### Đăng ký

```bash
curl -X POST http://localhost:8000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Nguyen Van A\",\"email\":\"a@example.com\",\"phone\":\"0900000000\",\"password\":\"123456\"}"
```

Mật khẩu được hash bằng `bcryptjs` và không trả về trong response.

### Đăng nhập

```bash
curl -X POST http://localhost:8000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"a@example.com\",\"password\":\"123456\"}"
```

Response đăng nhập trả về JWT trong `data.token`.

## API

| Method | URL                  | Mô tả                 |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Tạo tài khoản mới     |
| POST   | `/api/auth/login`    | Đăng nhập và nhận JWT |

Các lỗi thường gặp: `400` dữ liệu không hợp lệ, `401` email/mật khẩu sai, `403` tài khoản không ACTIVE, `409` email hoặc số điện thoại đã tồn tại.

## 5. CRUD category

Base URL: `http://localhost:8000/api/categories`

| Method | URL                   | Mô tả                |
| ------ | --------------------- | -------------------- |
| GET    | `/api/categories`     | Lấy tất cả category  |
| GET    | `/api/categories/:id` | Lấy category theo id |
| POST   | `/api/categories`     | Tạo category         |
| PUT    | `/api/categories/:id` | Cập nhật category    |
| DELETE | `/api/categories/:id` | Xóa category         |

### Tạo category

```json
{
  "name": "Điện thoại",
  "slug": "dien-thoai",
  "description": "Các sản phẩm điện thoại",
  "imageUrl": "https://example.com/phone.jpg",
  "status": "ACTIVE"
}
```

Ví dụ bằng PowerShell:

```powershell
$body = @{ name = 'Điện thoại'; slug = 'dien-thoai'; description = 'Các sản phẩm điện thoại'; imageUrl = 'https://example.com/phone.jpg'; status = 'ACTIVE' } | ConvertTo-Json
Invoke-WebRequest -Method Post -Uri http://localhost:8000/api/categories -ContentType 'application/json' -Body $body
```

`name` và `slug` là bắt buộc. `status` chỉ nhận `ACTIVE` hoặc `INACTIVE`. Tên và slug phải duy nhất.

## 6. CRUD role

Base URL: `http://localhost:8000/api/roles`

| Method | URL              | Mô tả            |
| ------ | ---------------- | ---------------- |
| GET    | `/api/roles`     | Lấy tất cả role  |
| GET    | `/api/roles/:id` | Lấy role theo id |
| POST   | `/api/roles`     | Tạo role         |
| PUT    | `/api/roles/:id` | Cập nhật role    |
| DELETE | `/api/roles/:id` | Xóa role         |

Body tạo/cập nhật role:

```json
{
  "name": "ADMIN",
  "description": "Quản trị viên"
}
```

`name` là bắt buộc, dài tối đa 50 ký tự và phải duy nhất. `description` dài tối đa 255 ký tự. Không thể xóa role đang được user sử dụng.

## 7. CRUD user

Base URL: `http://localhost:8000/api/users`

| Method | URL              | Mô tả            |
| ------ | ---------------- | ---------------- |
| GET    | `/api/users`     | Lấy tất cả user  |
| GET    | `/api/users/:id` | Lấy user theo id |
| POST   | `/api/users`     | Tạo user         |
| PUT    | `/api/users/:id` | Cập nhật user    |
| DELETE | `/api/users/:id` | Xóa user         |

Body tạo user:

```json
{
  "roleId": 1,
  "fullName": "Nguyen Van A",
  "email": "a@example.com",
  "phone": "0900000000",
  "password": "123456",
  "avatarUrl": "https://example.com/avatar.jpg",
  "status": "ACTIVE"
}
```

Khi cập nhật, các trường có thể gửi từng phần; `password` sẽ được hash bằng bcrypt. `status` chỉ nhận `ACTIVE`, `INACTIVE` hoặc `BLOCKED`. Response không trả về mật khẩu. Không thể xóa user đang được bảng khác tham chiếu.

## 8. CRUD product

Base URL: `http://localhost:8000/api/products`

| Method | URL                 | Mô tả                |
| ------ | ------------------- | -------------------- |
| GET    | `/api/products`     | Lấy tất cả sản phẩm  |
| GET    | `/api/products/:id` | Lấy sản phẩm theo id |
| POST   | `/api/products`     | Tạo sản phẩm         |
| PUT    | `/api/products/:id` | Cập nhật sản phẩm    |
| DELETE | `/api/products/:id` | Xóa sản phẩm         |

Body tạo/cập nhật sản phẩm:

```json
{
  "categoryId": 1,
  "brandId": 1,
  "name": "Laptop Gaming",
  "slug": "laptop-gaming",
  "description": "Laptop cho chơi game",
  "thumbnailUrl": "https://example.com/laptop.jpg",
  "status": "DRAFT"
}
```

`categoryId`, `brandId`, `name` và `slug` là bắt buộc khi tạo. `slug` phải duy nhất; `status` chỉ nhận `DRAFT`, `ACTIVE` hoặc `INACTIVE`. Không thể xóa sản phẩm đang có product variant.

## Cart, voucher, order và inventory API

Các endpoint dưới đây yêu cầu JWT. Cart và order chỉ thao tác trên dữ liệu của
user hiện tại; giá, tồn kho, voucher và tổng tiền được tính lại ở backend.

- Cart: `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/:id`,
  `DELETE /api/cart/items/:id`, `DELETE /api/cart`.
- Voucher: `GET /api/vouchers/available`, `GET /api/vouchers/:code`.
  Admin/staff có thêm các endpoint quản trị voucher.
- Order: `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`,
  `PATCH /api/orders/:id/cancel`.
- Admin/staff: `GET /api/admin/orders`,
  `PATCH /api/orders/:id/status`.
- Payment: `GET/POST /api/orders/:orderId/payment`,
  `PATCH /api/payments/:id/status`.
- Inventory: `GET /api/inventory/transactions`,
  `POST /api/inventory/import`, `POST /api/inventory/adjustment`.

## Build, warranty và notification API

- Build template: `GET/POST /api/build-templates`, `GET/PUT /:id`,
  `PATCH /:id/status`.
- Custom build: `GET/POST /api/custom-builds`, `GET /:id`,
  `POST /:id/items`, `PUT /:id/items`, `POST /:id/submit`,
  `POST /:id/checkout`.
- Warranty: `GET /api/warranties`, `GET /:id`,
  `GET /serial/:serialNumber`, `POST`, `PATCH /:id`.
- Notification: `GET /api/notifications`,
  `GET /api/notifications/unread-count`, `PATCH /:id/read`,
  `PATCH /read-all`, `DELETE /:id`.
