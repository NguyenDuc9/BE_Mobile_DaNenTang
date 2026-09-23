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

## Phân rã task triển khai Người 1

Người 1 phụ trách nền tảng tài khoản, catalog và review. Các task phải giữ
đúng interface mà Người 2 sử dụng cho `users`, `products`,
`product_variants` và `addresses`. Nếu thay đổi tên field hoặc response, phải
thông báo và thống nhất trước khi Người 2 tích hợp.

### Phase 1A — Nền tảng tài khoản và địa chỉ

#### T1-01 — Hoàn thiện roles và users

- Seed và truy vấn đúng các role nghiệp vụ: `admin`, `staff`, `customer`.
- Hoàn thiện đăng ký, đăng nhập và lấy thông tin user.
- Không cho client truyền role để tự nâng quyền khi đăng ký.
- Kiểm tra email, phone, password và trạng thái tài khoản.
- Không trả `password_hash` trong bất kỳ response nào.
- JWT phải chứa định danh user và role để middleware phân quyền sử dụng.
- Xử lý rõ email/phone trùng, user không tồn tại và tài khoản bị khóa.

**API tối thiểu:**

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

**Đầu ra:** auth middleware ổn định, response user thống nhất và interface
quyền dùng chung cho cả mobile app và admin web.

#### T1-02 — Addresses

- CRUD địa chỉ của user hiện tại.
- Kiểm tra ownership khi xem, sửa, xóa địa chỉ.
- Hỗ trợ đặt một địa chỉ mặc định cho mỗi user.
- Khi đặt địa chỉ mới làm mặc định, bỏ mặc định của địa chỉ cũ trong
  transaction.
- Validate receiver name, phone, address line, province và tọa độ nếu có.
- Không cho order service dùng address của user khác.

**API tối thiểu:**

- `GET /api/addresses`
- `GET /api/addresses/:id`
- `POST /api/addresses`
- `PUT /api/addresses/:id`
- `DELETE /api/addresses/:id`
- `PATCH /api/addresses/:id/default`

**Phụ thuộc:** T1-01.  
**Được dùng bởi:** T2-05, T2-11.

### Phase 1B — Catalog bán sẵn và linh kiện

#### T1-03 — Categories và brands

- CRUD category và brand theo quyền admin/staff.
- Customer chỉ xem dữ liệu đang `ACTIVE`.
- `name` và `slug` phải unique.
- Validate slug, status và dữ liệu bắt buộc.
- Không cho xóa bản ghi đang được product tham chiếu nếu vi phạm foreign key.
- Hỗ trợ danh sách cho mobile và danh sách quản trị cho web admin.

**API tối thiểu:**

- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/brands`
- `GET /api/brands/:id`
- `POST /api/brands`
- `PUT /api/brands/:id`
- `DELETE /api/brands/:id`

**Phụ thuộc:** T1-01.

#### T1-04 — Products và product variants

- CRUD product với category, brand, slug, mô tả, thumbnail và status.
- CRUD variant với SKU, tên cấu hình, giá, giá so sánh, tồn kho và status.
- SKU và slug phải unique.
- Giá và `compare_at_price` không được âm.
- Variant phải thuộc đúng product.
- Không cho product chuyển `ACTIVE` nếu chưa có variant `ACTIVE`.
- Product/variant `ACTIVE` để bán sẵn phải có dữ liệu đủ để hiển thị giá.
- Sản phẩm chỉ có một cấu hình dùng variant `"Mặc định"` thay vì thêm giá trực
  tiếp vào `products`.
- Không cho catalog API trả product active không có variant bán được.
- Hỗ trợ lọc theo category, brand, khoảng giá, status và phân trang.
- Tách API customer và API quản trị nếu quyền/response khác nhau.

**API tối thiểu:**

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `PATCH /api/products/:id/status`
- `DELETE /api/products/:id`
- `GET /api/products/:productId/variants`
- `POST /api/products/:productId/variants`
- `PUT /api/variants/:id`
- `PATCH /api/variants/:id/status`
- `DELETE /api/variants/:id`

**Phụ thuộc:** T1-03.  
**Được dùng bởi:** T2-03, T2-04, T2-08, T2-09, T2-10.

#### T1-05 — Product images

- Thêm, sửa thứ tự, đặt ảnh chính và xóa ảnh của product.
- Ảnh phải thuộc product tồn tại.
- Chỉ cho một ảnh chính theo từng product.
- Khi đặt ảnh mới là primary, bỏ primary cũ trong transaction.
- Không xóa ảnh của product khác hoặc product không có quyền quản lý.
- API product detail phải trả ảnh theo `sort_order`.

**API tối thiểu:**

- `GET /api/products/:productId/images`
- `POST /api/products/:productId/images`
- `PUT /api/product-images/:id`
- `PATCH /api/product-images/:id/primary`
- `DELETE /api/product-images/:id`

**Phụ thuộc:** T1-04.

### Phase 1C — Favorites và reviews

#### T1-06 — Favorites

- User thêm/xóa product yêu thích của chính mình.
- Không trùng `(user_id, product_id)`.
- Chỉ cho yêu thích product tồn tại và đang được hiển thị.
- Danh sách có phân trang và thông tin product cần thiết cho mobile.
- Không cho user thao tác favorite của user khác.

**API tối thiểu:**

- `GET /api/favorites`
- `POST /api/favorites/:productId`
- `DELETE /api/favorites/:productId`
- `GET /api/products/:productId/favorite`

**Phụ thuộc:** T1-01, T1-04.

#### T1-07 — Reviews

- Customer tạo review cho product đã mua hợp lệ.
- Nếu dùng `order_item_id`, phải kiểm tra order item thuộc user và order đạt
  trạng thái đủ điều kiện review.
- Rating chỉ từ 1 đến 5.
- Một chính sách rõ ràng cho review trùng cùng order item/product.
- Customer chỉ sửa/xóa review của mình trong trạng thái cho phép.
- Staff/admin duyệt hoặc ẩn review.
- Chỉ review `APPROVED` mới xuất hiện trên public product API.
- Không cho review product khác với product của order item.

**API tối thiểu:**

- `GET /api/products/:productId/reviews`
- `POST /api/products/:productId/reviews`
- `PUT /api/reviews/:id`
- `DELETE /api/reviews/:id`
- `PATCH /api/reviews/:id/status`

**Phụ thuộc:** T1-01, T1-04, order/order_items của T2-05.

## Quy tắc interface Người 1 cung cấp cho Người 2

- `users.id` là định danh user dùng trong toàn bộ ownership check.
- `products.id` là sản phẩm gốc; không dùng product id thay cho variant id khi
  tính giá, tồn kho, cart hoặc order.
- `product_variants.id` là đơn vị bán/linh kiện có SKU, giá và tồn kho.
- `product_variants.stock_quantity` là tồn kho hiện tại; mọi thay đổi tồn kho
  phải do inventory service của Người 2 ghi lịch sử.
- `addresses.id` chỉ được dùng nếu thuộc `orders.user_id`.
- Không đổi tên các field cốt lõi mà không cập nhật cả hai bên:
  `user_id`, `product_id`, `product_variant_id`, `address_id`, `price`,
  `stock_quantity`, `status`.
- Custom build của Người 2 chỉ tham chiếu catalog của Người 1; không tạo bản
  sao product/variant trong bảng build.

## Tiêu chí nghiệm thu Người 1

- Auth bảo vệ được endpoint và không có đường nâng quyền qua request đăng ký.
- Customer chỉ truy cập được address, favorite, review của mình.
- Catalog public không hiển thị product/variant inactive hoặc không bán được.
- Product active luôn có ít nhất một variant active có giá hợp lệ.
- SKU, slug, category, brand và favorite xử lý đúng dữ liệu trùng.
- Product detail trả đủ ảnh, variant và thông tin giá cần cho mobile.
- Review kiểm tra đúng quyền mua hàng và trạng thái duyệt.
- API contract được ghi vào README/API documentation trước khi Người 2 tích
  hợp checkout và custom build.

## Người 2 — Phần của tôi

Phụ trách 14 bảng:

1. `carts`
2. `cart_items`
3. `vouchers`
4. `build_templates`
5. `build_template_items`
6. `custom_builds`
7. `custom_build_items`
8. `orders`
9. `order_items`
10. `order_vouchers`
11. `payments`
12. `inventory_transactions`
13. `warranties`
14. `notifications`

### Yêu cầu chức năng

- `carts`, `cart_items`: mỗi user có một cart; không trùng
  `(cart_id, product_variant_id)`; số lượng phải lớn hơn 0.
- `vouchers`: kiểm tra code duy nhất, thời gian hiệu lực, loại giảm giá,
  giá trị giảm và giới hạn sử dụng.
- `build_templates`, `build_template_items`: lưu cấu hình mẫu cho các build PC
  tùy chỉnh; mỗi item phải gắn với linh kiện hợp lệ và có `component_type` rõ ràng.
- `custom_builds`, `custom_build_items`: user tự chọn linh kiện, tính tổng tiền
  ở backend, lưu snapshot linh kiện và giá tại thời điểm tạo build; không tin
  giá từ client.
- `orders`, `order_items`: lưu snapshot người nhận, địa chỉ, tên sản phẩm,
  variant, SKU và giá tại thời điểm đặt hàng; hỗ trợ cả `READY_PRODUCT` và
  `CUSTOM_BUILD`.
- `order_vouchers`: mỗi order tối đa một voucher và lưu số tiền giảm thực tế.
- `payments`: mỗi order tối đa một payment; dùng đúng enum method/status trong
  schema.
- `inventory_transactions`: ghi nhận nhập, bán, hủy và điều chỉnh; quantity
  không được bằng 0.
- `warranties`: kiểm tra ngày kết thúc không trước ngày bắt đầu và liên kết
  đúng với order item/variant.
- `notifications`: tạo, lấy danh sách theo user và đánh dấu đã đọc.
- Dùng transaction cho các thao tác nhiều bảng như tạo order, áp voucher,
  trừ tồn kho, tạo payment, xác nhận custom build và tạo order từ build.

## Phân rã task triển khai Người 2

Các task phải được thực hiện theo thứ tự phụ thuộc bên dưới. Mỗi task chỉ được
đánh dấu hoàn thành khi có code, API documentation liên quan và kiểm tra phù
hợp. Không triển khai custom build bằng cách tạo bản sao của `products` hoặc
`product_variants`.

### Phase 0 — Nền tảng dùng chung

#### T2-01 — Chuẩn hóa database và transaction

- Xác nhận model/repository dùng đúng tên bảng, cột, enum và khóa ngoại trong
  `schema.sql`.
- Bổ sung helper `beginTransaction`, `commit`, `rollback`, `withTransaction`
  theo pool/connection hiện có.
- Bảo đảm connection được release trong cả nhánh thành công và lỗi.
- Không nuốt lỗi database; lỗi phải được log ở controller/service theo pattern
  thống nhất.

#### T2-02 — Chuẩn hóa authentication, authorization và validation

- Dùng JWT hiện có để xác định `user_id` từ token.
- Bổ sung middleware phân quyền `customer`, `staff`, `admin`.
- Không cho client truyền role để tự nâng quyền.
- Validate ID, số lượng, tiền, enum, ngày giờ, pagination và body bắt buộc.
- Chuẩn hóa response cho `400`, `401`, `403`, `404`, `409`, `422`, `500`.
- Kiểm tra ownership trước mọi thao tác trên cart, build, order, warranty và
  notification.

**Phụ thuộc:** không có.  
**Đầu ra:** helper transaction, middleware quyền, validation/error pattern.

### Phase 1 — Giỏ hàng bán sẵn

#### T2-03 — Cart và cart items

- Tạo/lấy một cart duy nhất cho user.
- Thêm, sửa, xóa item theo `product_variant_id`.
- Xử lý trùng `(cart_id, product_variant_id)` theo quy tắc tăng hoặc cập nhật
  số lượng thống nhất.
- Chỉ cho dùng variant và product đang `ACTIVE`.
- Không nhận giá từ client; response lấy giá hiện tại từ database.
- Chỉ truy cập item thuộc cart của user hiện tại.

**API tối thiểu:**

- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/:id`
- `DELETE /api/cart/items/:id`
- `DELETE /api/cart`

**Phụ thuộc:** T2-01, T2-02, `users`, `products`, `product_variants`.

### Phase 2 — Voucher

#### T2-04 — Quản lý và kiểm tra voucher

- Admin/staff tạo, sửa, bật/tắt và xem voucher.
- Customer chỉ xem/kiểm tra voucher khả dụng.
- Chuẩn hóa `code` trước khi kiểm tra unique.
- Kiểm tra loại `PERCENT`/`FIXED`, giá trị giảm, min order, max discount,
  thời hạn và usage limit.
- Tính discount ở backend bằng số tiền từ database.
- Khi checkout phải khóa voucher và tăng `used_count` trong cùng transaction.

**API tối thiểu:**

- `GET /api/vouchers/available`
- `GET /api/vouchers/:code`
- `POST /api/vouchers`
- `PUT /api/vouchers/:id`
- `PATCH /api/vouchers/:id/status`

**Phụ thuộc:** T2-01, T2-02.

### Phase 3 — Order bán sản phẩm sẵn

#### T2-05 — Tạo order từ cart

- Kiểm tra địa chỉ thuộc user.
- Khóa cart items và product variants bằng `SELECT ... FOR UPDATE`.
- Từ database lấy tên product, variant, SKU, giá và tồn kho.
- Từ chối cart rỗng, variant không tồn tại, variant inactive hoặc thiếu kho.
- Tạo snapshot delivery trong `orders`.
- Tạo snapshot sản phẩm trong `order_items`.
- Tính `subtotal`, `shipping_fee`, `discount_amount`, `total_amount` ở backend.
- Gắn `order_type = READY_PRODUCT`.
- Không nhận subtotal, total, unit price hoặc discount do client gửi.
- Xóa cart items chỉ sau khi toàn bộ order tạo thành công.

**API tối thiểu:**

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/cancel`

**Phụ thuộc:** T2-01, T2-02, T2-03, T2-04, `addresses`.

#### T2-06 — Quản lý trạng thái order và quyền staff/admin

- Khai báo state transition hợp lệ cho các enum order trong schema.
- Customer chỉ xem/hủy order của mình trong trạng thái được phép.
- Staff/admin xem tất cả order và cập nhật trạng thái theo quyền.
- Lưu `cancelled_reason` khi hủy.
- Tạo notification khi order được tạo, đổi trạng thái hoặc hủy.

**API tối thiểu:**

- `GET /api/admin/orders`
- `PATCH /api/orders/:id/status`

**Phụ thuộc:** T2-05, T2-09.

### Phase 4 — Payment và inventory

#### T2-07 — Payment

- Mỗi order chỉ có một payment.
- Chỉ dùng enum method/status trong schema.
- `amount` phải khớp tổng order do backend tính.
- Validate transition `PENDING`, `PAID`, `FAILED`, `REFUNDED`.
- Kiểm tra ownership với customer và quyền staff/admin với thao tác quản trị.
- Không tạo payment thứ hai cho cùng order.

**API tối thiểu:**

- `GET /api/orders/:orderId/payment`
- `POST /api/orders/:orderId/payment`
- `PATCH /api/payments/:id/status`

**Phụ thuộc:** T2-05.

#### T2-08 — Inventory transactions

- Nhập kho, bán, hủy và điều chỉnh phải cập nhật stock cùng lịch sử giao dịch.
- Chỉ dùng `IMPORT`, `SALE`, `CANCEL`, `ADJUSTMENT`.
- Không cho quantity bằng 0.
- Không cho tồn kho âm.
- Mỗi thay đổi stock phải ghi `inventory_transactions`.
- Khi hủy order hợp lệ phải hoàn kho đúng số lượng và ghi `CANCEL`.
- Dùng `FOR UPDATE` trên variant khi thay đổi stock.

**API tối thiểu:**

- `GET /api/inventory/transactions`
- `POST /api/inventory/import`
- `POST /api/inventory/adjustment`

**Phụ thuộc:** T2-01, T2-02, T2-05, T2-06.

### Phase 5 — Custom build

#### T2-09 — Build templates

- Admin/staff tạo, sửa, bật/tắt và xem build template.
- Mỗi template item phải tham chiếu product/variant tồn tại.
- Kiểm tra variant thuộc đúng product.
- `component_type` bắt buộc và phải thuộc danh sách quy ước của hệ thống
  như `CPU`, `MAINBOARD`, `RAM`, `GPU`, `STORAGE`, `PSU`, `CASE`, `COOLER`.
- Số lượng phải lớn hơn 0.
- Tính lại `estimated_total` từ giá hiện tại ở backend.
- Không cho template ACTIVE nếu thiếu thành phần bắt buộc theo quy tắc build.

**API tối thiểu:**

- `GET /api/build-templates`
- `GET /api/build-templates/:id`
- `POST /api/build-templates`
- `PUT /api/build-templates/:id`
- `PATCH /api/build-templates/:id/status`

**Phụ thuộc:** T2-01, T2-02, `products`, `product_variants`.

#### T2-10 — Custom builds

- Customer tạo build nháp từ template hoặc tự chọn linh kiện.
- Thêm, sửa, xóa item trong build của chính mình.
- Lấy giá, tên, variant, SKU từ database; không tin giá client.
- Lưu snapshot vào `custom_build_items`.
- Tính lại `base_price`, `discount_amount`, `total_amount` ở backend.
- Kiểm tra duplicate component khi hệ thống yêu cầu mỗi loại một item.
- Kiểm tra tương thích tối thiểu giữa các component trước khi submit.
- Chỉ cho chuyển build sang `PENDING` khi có đủ thành phần bắt buộc.
- Customer không được sửa build sau khi đã `CONFIRMED`.

**API tối thiểu:**

- `GET /api/custom-builds`
- `GET /api/custom-builds/:id`
- `POST /api/custom-builds`
- `PUT /api/custom-builds/:id`
- `POST /api/custom-builds/:id/items`
- `PUT /api/custom-builds/:id/items/:itemId`
- `DELETE /api/custom-builds/:id/items/:itemId`
- `POST /api/custom-builds/:id/submit`

**Phụ thuộc:** T2-01, T2-02, T2-09.

#### T2-11 — Tạo order từ custom build

- Chỉ nhận build thuộc user hiện tại và đang ở trạng thái được phép.
- Khóa build items và các variant liên quan.
- Kiểm tra lại giá, trạng thái và tồn kho tại thời điểm tạo order.
- Tạo `orders` với `order_type = CUSTOM_BUILD` và `custom_build_id`.
- Tạo `order_items` snapshot từng linh kiện.
- Áp voucher theo cùng quy tắc order bán sẵn.
- Reserve/trừ kho theo quyết định nghiệp vụ thống nhất; không trừ hai lần.
- Chuyển trạng thái build và tạo payment trong transaction.
- Rollback toàn bộ nếu thiếu một linh kiện hoặc lỗi payment.

**API tối thiểu:**

- `POST /api/custom-builds/:id/checkout`

**Phụ thuộc:** T2-04, T2-05, T2-07, T2-08, T2-10.

### Phase 6 — Warranty và notification

#### T2-12 — Warranty

- Staff/admin tạo và cập nhật warranty theo order item hợp lệ.
- Kiểm tra `end_date >= start_date`.
- Kiểm tra variant khớp order item nếu `product_variant_id` có giá trị.
- Serial number phải unique.
- Customer chỉ xem warranty thuộc order của mình.
- Chỉ cho trạng thái `ACTIVE`, `EXPIRED`, `CLAIMED`.

**API tối thiểu:**

- `GET /api/warranties`
- `GET /api/warranties/:id`
- `GET /api/warranties/serial/:serialNumber`
- `POST /api/warranties`
- `PATCH /api/warranties/:id`

**Phụ thuộc:** T2-05, `order_items`, `product_variants`.

#### T2-13 — Notifications

- Tạo notification từ service nghiệp vụ, không để client tự gán user tùy ý.
- Customer chỉ lấy/đọc/xóa notification của mình.
- Có phân trang và sắp xếp mới nhất trước.
- Hỗ trợ đánh dấu một notification hoặc tất cả là đã đọc.
- Có unread count.

**API tối thiểu:**

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`

**Phụ thuộc:** T2-02 và các service order/payment/build.

## Ma trận transaction bắt buộc

| Nghiệp vụ | Transaction | Bản ghi cần khóa |
|---|---:|---|
| Tạo/lấy cart và thêm item | Có khi phải tạo cart | `carts`, `cart_items` |
| Tạo order hàng sẵn | Bắt buộc | `cart_items`, `product_variants`, voucher |
| Cập nhật tồn kho | Bắt buộc | `product_variants` |
| Hủy order hoàn kho | Bắt buộc | order, variants |
| Tạo order custom build | Bắt buộc | build items, variants, voucher |
| Tạo payment cùng order | Cùng transaction checkout | order |
| Xác nhận build | Bắt buộc nếu reserve kho | build items, variants |

## Quy tắc tích hợp hai mô hình bán hàng

- `READY_PRODUCT` bắt đầu từ `cart_items`.
- `CUSTOM_BUILD` bắt đầu từ `custom_builds`; không bắt buộc đi qua cart.
- Cả hai loại cuối cùng đều tạo `orders`, `order_items`, `payments` và
  `inventory_transactions`.
- Giá, tồn kho, tên, SKU và trạng thái luôn được đọc lại từ database ở bước
  checkout.
- `order_items` là snapshot bất biến về mặt nghiệp vụ; không cập nhật theo
  thay đổi mới của catalog.
- Không cho một order vừa có `custom_build_id` vừa xử lý như order hàng sẵn.

## Tiêu chí nghiệm thu theo phase

- Phase 0: request không xác thực bị chặn; lỗi được trả đúng mã; transaction
  rollback được khi một query lỗi.
- Phase 1: cart của user A không thể truy cập bởi user B; duplicate variant và
  quantity không hợp lệ được xử lý đúng.
- Phase 2: voucher hết hạn, hết lượt, sai điều kiện hoặc sai loại giảm đều bị
  từ chối; không tăng `used_count` khi checkout rollback.
- Phase 3: order lưu đúng snapshot; không thể đặt vượt kho; cart chỉ bị xóa
  sau commit.
- Phase 4: stock và inventory history luôn thay đổi đồng bộ; không có stock âm.
- Phase 5: build không đủ linh kiện hoặc sai tương thích không thể submit;
  tổng tiền server phải khớp với snapshot item.
- Phase 6: warranty và notification luôn được giới hạn theo ownership/quyền.

### Phụ thuộc

Người 2 sử dụng các bảng và API do Người 1 cung cấp cho:

- `users`
- `products`
- `product_variants`
- `addresses`

Đối với custom build, Người 2 có thể dùng linh kiện trong `products` và
`product_variants` như nguồn dữ liệu cho `build_templates`, `custom_builds` và
`custom_build_items`. Không tạo bản sao các model hoặc bảng trên. Nếu cần thay
đổi interface, hai người phải thống nhất trước để tránh xung đột khi merge.

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
- Hỗ trợ đầy đủ 2 mô hình bán hàng: `READY_PRODUCT` và `CUSTOM_BUILD`.
- Với custom build, lưu snapshot linh kiện, giá và cấu hình trước khi xác nhận
  đơn; không dùng dữ liệu client làm nguồn sự thật cho tổng tiền.
- Cập nhật README/API documentation cho phần đã triển khai.
- Chạy kiểm tra phù hợp trước khi mở pull request.
