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
