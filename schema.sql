-- ============================================================
-- DATABASE: computer_store_db
-- Hệ thống bán máy tính
-- Stack: MySQL + Node.js/Express + Next.js Admin + Expo Mobile
-- ============================================================

DROP DATABASE IF EXISTS computer_store_db;
CREATE DATABASE computer_store_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE computer_store_db;

-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_users_role (role_id),
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 4. BRANDS
-- ============================================================
CREATE TABLE brands (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    logo_url VARCHAR(500),
    description TEXT,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 5. PRODUCTS
-- Thông tin chung của sản phẩm
-- ============================================================
CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT UNSIGNED NOT NULL,
    brand_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description TEXT,
    thumbnail_url VARCHAR(500),
    status ENUM('DRAFT', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'DRAFT',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_products_brand
        FOREIGN KEY (brand_id) REFERENCES brands(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    INDEX idx_products_category (category_id),
    INDEX idx_products_brand (brand_id),
    INDEX idx_products_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 6. PRODUCT_IMAGES
-- Một sản phẩm có nhiều ảnh
-- ============================================================
CREATE TABLE product_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_product_images_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 7. PRODUCT_VARIANTS
-- SKU thực tế: CPU/RAM/SSD/GPU/Màn hình...
-- ============================================================
CREATE TABLE product_variants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    variant_name VARCHAR(255) NOT NULL,

    price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    compare_at_price DECIMAL(15,2),

    stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,

    cpu VARCHAR(150),
    ram VARCHAR(100),
    storage VARCHAR(150),
    gpu VARCHAR(150),
    screen_size VARCHAR(50),
    screen_resolution VARCHAR(100),
    refresh_rate VARCHAR(50),
    operating_system VARCHAR(100),
    color VARCHAR(80),
    weight_kg DECIMAL(6,2),

    warranty_months INT UNSIGNED NOT NULL DEFAULT 12,

    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_variants_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT chk_variant_price
        CHECK (price >= 0),

    CONSTRAINT chk_variant_compare_price
        CHECK (compare_at_price IS NULL OR compare_at_price >= 0),

    INDEX idx_variants_product (product_id),
    INDEX idx_variants_status (status),
    INDEX idx_variants_price (price)
) ENGINE=InnoDB;

-- ============================================================
-- 8. BUILD_TEMPLATES
-- Mẫu cấu hình máy tính do admin tạo sẵn cho custom build
-- ============================================================
CREATE TABLE build_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    estimated_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_build_templates_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 9. BUILD_TEMPLATE_ITEMS
-- Thành phần trong một build template
-- ============================================================
CREATE TABLE build_template_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED,
    component_type VARCHAR(80) NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_build_template_items_template
        FOREIGN KEY (template_id) REFERENCES build_templates(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_build_template_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_build_template_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_build_template_item_quantity
        CHECK (quantity > 0),

    INDEX idx_build_template_items_template (template_id),
    INDEX idx_build_template_items_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 10. CUSTOM_BUILDS
-- Build do khách hàng tự chọn linh kiện
-- ============================================================
CREATE TABLE custom_builds (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150),
    status ENUM('DRAFT', 'PENDING', 'CONFIRMED', 'ASSEMBLING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    base_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_custom_builds_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_custom_builds_user (user_id),
    INDEX idx_custom_builds_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 11. CUSTOM_BUILD_ITEMS
-- Linh kiện được khách chọn trong custom build
-- ============================================================
CREATE TABLE custom_build_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    custom_build_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED,
    component_type VARCHAR(80) NOT NULL,

    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255),
    sku VARCHAR(100),

    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_custom_build_items_build
        FOREIGN KEY (custom_build_id) REFERENCES custom_builds(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_custom_build_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_custom_build_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_custom_build_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_custom_build_item_price
        CHECK (unit_price >= 0),

    INDEX idx_custom_build_items_build (custom_build_id),
    INDEX idx_custom_build_items_product (product_id),
    INDEX idx_custom_build_items_variant (product_variant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 12. ADDRESSES
-- Địa chỉ khách hàng, có lat/lng để tích hợp Google Maps sau này
-- ============================================================
CREATE TABLE addresses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    receiver_name VARCHAR(150) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,

    address_line VARCHAR(255) NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100),
    province VARCHAR(100) NOT NULL,

    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),

    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_addresses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. CARTS
-- Mỗi user có một giỏ hàng hiện tại
-- ============================================================
CREATE TABLE carts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. CART_ITEMS
-- ============================================================
CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT uq_cart_variant
        UNIQUE (cart_id, product_variant_id),

    CONSTRAINT chk_cart_quantity
        CHECK (quantity > 0),

    INDEX idx_cart_items_cart (cart_id),
    INDEX idx_cart_items_variant (product_variant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. VOUCHERS
-- ============================================================
CREATE TABLE vouchers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),

    discount_type ENUM('PERCENT', 'FIXED') NOT NULL,
    discount_value DECIMAL(15,2) NOT NULL,

    min_order_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    max_discount DECIMAL(15,2),

    usage_limit INT UNSIGNED,
    used_count INT UNSIGNED NOT NULL DEFAULT 0,

    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,

    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_voucher_discount
        CHECK (discount_value >= 0),

    CONSTRAINT chk_voucher_dates
        CHECK (end_at > start_at),

    INDEX idx_vouchers_code (code),
    INDEX idx_vouchers_status (status),
    INDEX idx_vouchers_time (start_at, end_at)
) ENGINE=InnoDB;

CREATE TABLE voucher_products (
    voucher_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (voucher_id, product_id),
    CONSTRAINT fk_voucher_products_voucher
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_voucher_products_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_voucher_products_product (product_id)
) ENGINE=InnoDB;

-- ============================================================
-- 12. ORDERS
-- Địa chỉ được snapshot để đơn cũ không thay đổi
-- ============================================================
CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(30) NOT NULL UNIQUE,
    order_type ENUM('READY_PRODUCT', 'CUSTOM_BUILD') NOT NULL DEFAULT 'READY_PRODUCT',

    user_id BIGINT UNSIGNED NOT NULL,
    address_id BIGINT UNSIGNED,
    custom_build_id BIGINT UNSIGNED,

    delivery_receiver_name VARCHAR(150) NOT NULL,
    delivery_phone VARCHAR(20) NOT NULL,
    delivery_address VARCHAR(500) NOT NULL,
    delivery_latitude DECIMAL(10,7),
    delivery_longitude DECIMAL(10,7),

    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    voucher_code VARCHAR(50),

    status ENUM(
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPPING',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
        'DELIVERY_FAILED'
    ) NOT NULL DEFAULT 'PENDING',

    note TEXT,
    cancelled_reason VARCHAR(500),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_orders_address
        FOREIGN KEY (address_id) REFERENCES addresses(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT fk_orders_custom_build
        FOREIGN KEY (custom_build_id) REFERENCES custom_builds(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created (created_at),
    INDEX idx_orders_code (order_code),
    INDEX idx_orders_type (order_type),
    INDEX idx_orders_custom_build (custom_build_id)
) ENGINE=InnoDB;

-- ============================================================
-- 13. ORDER_ITEMS
-- Lưu snapshot tên/SKU/giá tại thời điểm mua
-- ============================================================
CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED,

    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,

    unit_price DECIMAL(15,2) NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_order_items_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_order_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_item_price
        CHECK (unit_price >= 0),

    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_variant (product_variant_id)
) ENGINE=InnoDB;

-- ============================================================
-- 14. ORDER_VOUCHERS
-- Lưu voucher thực tế được áp dụng cho đơn
-- ============================================================
CREATE TABLE order_vouchers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    voucher_id BIGINT UNSIGNED,
    voucher_code VARCHAR(50) NOT NULL,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_vouchers_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT fk_order_vouchers_voucher
        FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT uq_order_voucher
        UNIQUE (order_id),

    INDEX idx_order_vouchers_voucher (voucher_id)
) ENGINE=InnoDB;

-- ============================================================
-- 15. PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL UNIQUE,

    method ENUM('COD', 'BANK_TRANSFER', 'MOMO', 'VNPAY') NOT NULL,
    status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',

    transaction_code VARCHAR(150),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    paid_at DATETIME,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_payments_status (status),
    INDEX idx_payments_transaction (transaction_code)
) ENGINE=InnoDB;

-- ============================================================
-- 16. INVENTORY_TRANSACTIONS
-- Lịch sử nhập/xuất kho
-- ============================================================
CREATE TABLE inventory_transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_variant_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED,

    type ENUM('IMPORT', 'SALE', 'CANCEL', 'ADJUSTMENT') NOT NULL,
    quantity INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT UNSIGNED,
    note VARCHAR(500),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_inventory_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_inventory_quantity
        CHECK (quantity <> 0),

    INDEX idx_inventory_variant (product_variant_id),
    INDEX idx_inventory_type (type),
    INDEX idx_inventory_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- 17. REVIEWS
-- ============================================================
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    order_item_id BIGINT UNSIGNED,

    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT,
    status ENUM('PENDING', 'APPROVED', 'HIDDEN') NOT NULL DEFAULT 'PENDING',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_reviews_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_reviews_order_item
        FOREIGN KEY (order_item_id) REFERENCES order_items(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_review_rating
        CHECK (rating BETWEEN 1 AND 5),

    INDEX idx_reviews_product (product_id),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 18. FAVORITES
-

-- ============================================================
-- 19. WARRANTIES
-- ============================================================
CREATE TABLE warranties (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT UNSIGNED NOT NULL,
    product_variant_id BIGINT UNSIGNED,
    serial_number VARCHAR(150) UNIQUE,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status ENUM('ACTIVE', 'EXPIRED', 'CLAIMED') NOT NULL DEFAULT 'ACTIVE',
    note VARCHAR(500),

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_warranties_order_item
        FOREIGN KEY (order_item_id) REFERENCES order_items(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_warranties_variant
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CONSTRAINT chk_warranty_dates
        CHECK (end_date >= start_date),

    INDEX idx_warranties_order_item (order_item_id),
    INDEX idx_warranties_serial (serial_number),
    INDEX idx_warranties_status (status)
) ENGINE=InnoDB;

-- ============================================================
-- 20. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),

    reference_type VARCHAR(50),
    reference_id BIGINT UNSIGNED,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,

    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO roles (name, description) VALUES
('admin', 'Quản trị viên hệ thống'),
('staff', 'Nhân viên quản lý cửa hàng'),
('customer', 'Khách hàng');

INSERT INTO categories (name, slug, description) VALUES
('Laptop', 'laptop', 'Máy tính xách tay'),
('PC Gaming', 'pc-gaming', 'Máy tính để bàn gaming'),
('PC Văn phòng', 'pc-van-phong', 'Máy tính để bàn văn phòng'),
('Màn hình', 'man-hinh', 'Màn hình máy tính'),
('Linh kiện', 'linh-kien', 'CPU, RAM, SSD, VGA và linh kiện máy tính'),
('Phụ kiện', 'phu-kien', 'Chuột, bàn phím, tai nghe và phụ kiện');

INSERT INTO brands (name, slug, description) VALUES
('ASUS', 'asus', 'Thương hiệu máy tính ASUS'),
('Acer', 'acer', 'Thương hiệu máy tính Acer'),
('Dell', 'dell', 'Thương hiệu máy tính Dell'),
('HP', 'hp', 'Thương hiệu máy tính HP'),
('Lenovo', 'lenovo', 'Thương hiệu máy tính Lenovo'),
('MSI', 'msi', 'Thương hiệu máy tính MSI'),
('Apple', 'apple', 'Thương hiệu Apple'),
('Gigabyte', 'gigabyte', 'Thương hiệu Gigabyte');

-- ============================================================
-- SAMPLE PRODUCTS
-- ============================================================

INSERT INTO products
(category_id, brand_id, name, slug, description, thumbnail_url, status)
VALUES
(
    1, 1,
    'ASUS Vivobook 15',
    'asus-vivobook-15',
    'Laptop ASUS Vivobook 15 phục vụ học tập và văn phòng.',
    NULL,
    'ACTIVE'
),
(
    1, 6,
    'MSI Gaming Katana',
    'msi-gaming-katana',
    'Laptop gaming MSI hiệu năng cao.',
    NULL,
    'ACTIVE'
),
(
    2, 6,
    'PC Gaming MSI',
    'pc-gaming-msi',
    'Máy tính để bàn gaming MSI.',
    NULL,
    'ACTIVE'
);

INSERT INTO product_variants
(
    product_id,
    sku,
    variant_name,
    price,
    compare_at_price,
    stock_quantity,
    cpu,
    ram,
    storage,
    gpu,
    screen_size,
    screen_resolution,
    refresh_rate,
    operating_system,
    color,
    warranty_months,
    status
)
VALUES
(
    1,
    'ASUS-VB15-I5-8-512',
    'Core i5 / 8GB / 512GB',
    15990000,
    16990000,
    10,
    'Intel Core i5',
    '8GB',
    '512GB SSD',
    'Intel Graphics',
    '15.6 inch',
    '1920x1080',
    '60Hz',
    'Windows 11',
    'Bạc',
    24,
    'ACTIVE'
),
(
    1,
    'ASUS-VB15-I7-16-1TB',
    'Core i7 / 16GB / 1TB',
    21990000,
    22990000,
    5,
    'Intel Core i7',
    '16GB',
    '1TB SSD',
    'Intel Graphics',
    '15.6 inch',
    '1920x1080',
    '60Hz',
    'Windows 11',
    'Bạc',
    24,
    'ACTIVE'
),
(
    2,
    'MSI-KATANA-I7-16-1TB',
    'Core i7 / 16GB / 1TB / RTX 4060',
    29990000,
    31990000,
    7,
    'Intel Core i7',
    '16GB',
    '1TB SSD',
    'NVIDIA GeForce RTX 4060',
    '15.6 inch',
    '1920x1080',
    '144Hz',
    'Windows 11',
    'Đen',
    24,
    'ACTIVE'
);

INSERT INTO vouchers
(
    code,
    name,
    description,
    discount_type,
    discount_value,
    min_order_value,
    max_discount,
    usage_limit,
    start_at,
    end_at,
    status
)
VALUES
(
    'WELCOME50',
    'Giảm 50K cho khách mới',
    'Voucher dùng thử hệ thống',
    'FIXED',
    50000,
    5000000,
    50000,
    1000,
    CURRENT_TIMESTAMP,
    DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 DAY),
    'ACTIVE'
);

-- ============================================================
-- KIỂM TRA
-- ============================================================

SELECT 'Database computer_store_db created successfully!' AS message;

SHOW TABLES;
