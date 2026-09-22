# Quy tắc phân công backend theo schema

Tài liệu này chỉ dùng để phân công công việc. Không triển khai code trong
phạm vi tài liệu này.

Schema nguồn: `D:\react-mobile\schema.sql` (`computer_store_db`).

## Trạng thái hiện tại trên nhánh `dev`

Người 1 đã có code cho:

- `roles`
- `users`
- `categories`
- `products`

Theo schema, Người 1 còn phụ trách và cần hoàn thiện:

- `addresses`
- `brands`
- `product_images`
- `product_variants`
- `favorites`
- `reviews`

## Người 1 — User + Product + Review

Phụ trách toàn bộ 10 bảng:

1. `roles`
2. `users`
3. `addresses`
4. `categories`
5. `brands`
6. `products`
7. `product_images`
8. `product_variants`
9. `favorites`
10. `reviews`

Người 1 không triển khai các bảng thuộc phạm vi Người 2 bên dưới.

## Người 2 — Phần của tôi

Phụ trách 10 bảng:

1. `carts`
2. `cart_items`
3. `vouchers`
4. `orders`
5. `order_items`
6. `order_vouchers`
7. `payments`
8. `inventory_transactions`
9. `warranties`
10. `notifications`

### Yêu cầu chức năng

- `carts`, `cart_items`: mỗi user có một cart; không trùng
  `(cart_id, product_variant_id)`; số lượng phải lớn hơn 0.
- `vouchers`: kiểm tra code duy nhất, thời gian hiệu lực, loại giảm giá,
  giá trị giảm và giới hạn sử dụng.
- `orders`, `order_items`: lưu snapshot người nhận, địa chỉ, tên sản phẩm,
  variant, SKU và giá tại thời điểm đặt hàng.
- `order_vouchers`: mỗi order tối đa một voucher và lưu số tiền giảm thực tế.
- `payments`: mỗi order tối đa một payment; dùng đúng enum method/status trong
  schema.
- `inventory_transactions`: ghi nhận nhập, bán, hủy và điều chỉnh; quantity
  không được bằng 0.
- `warranties`: kiểm tra ngày kết thúc không trước ngày bắt đầu và liên kết
  đúng với order item/variant.
- `notifications`: tạo, lấy danh sách theo user và đánh dấu đã đọc.
- Dùng transaction cho các thao tác nhiều bảng như tạo order, áp voucher,
  trừ tồn kho và tạo payment.

### Phụ thuộc

Người 2 sử dụng các bảng và API do Người 1 cung cấp cho:

- `users`
- `products`
- `product_variants`
- `addresses`

Không tạo bản sao các model hoặc bảng trên. Nếu cần thay đổi interface, hai
người phải thống nhất trước để tránh xung đột khi merge.

## Quy tắc branch và pull request

- Mỗi người làm trên branch riêng theo chức năng.
- Branch phải được tạo từ `dev`.
- Người 2 chỉ push branch chức năng của mình, không push trực tiếp vào `dev`.
- Pull request phải target vào `dev`.
- Không merge pull request khi chưa được review và chấp nhận.
- Mỗi branch chỉ chứa thay đổi thuộc phạm vi của người đó.
- Không commit file `.env`, mật khẩu, token hoặc dữ liệu bí mật.

## Tiêu chí hoàn thành

- Tên bảng, cột, enum, khóa ngoại và constraint phải khớp
  `D:\react-mobile\schema.sql`.
- Có validation dữ liệu đầu vào và kiểm tra quyền truy cập.
- Có xử lý rõ ràng cho bản ghi không tồn tại, dữ liệu trùng và lỗi khóa ngoại.
- Các thao tác liên quan nhiều bảng phải bảo đảm tính toàn vẹn transaction.
- Cập nhật README/API documentation cho phần đã triển khai.
- Chạy kiểm tra phù hợp trước khi mở pull request.
