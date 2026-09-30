const tableExists = async (connection, tableName) => {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ? LIMIT 1`,
    [tableName],
  );
  return Boolean(rows[0]);
};

const columnExists = async (connection, tableName, columnName) => {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
     LIMIT 1`,
    [tableName, columnName],
  );
  return Boolean(rows[0]);
};

const indexExists = async (connection, tableName, indexName) => {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?
     LIMIT 1`,
    [tableName, indexName],
  );
  return Boolean(rows[0]);
};

const constraintExists = async (connection, tableName, constraintName) => {
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = ?
       AND constraint_name = ? LIMIT 1`,
    [tableName, constraintName],
  );
  return Boolean(rows[0]);
};

const addColumn = async (connection, tableName, columnName, definition) => {
  if (!(await columnExists(connection, tableName, columnName))) {
    await connection.query(
      `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`,
    );
  }
};

const addIndex = async (connection, tableName, indexName, definition) => {
  if (!(await indexExists(connection, tableName, indexName))) {
    await connection.query(
      `ALTER TABLE \`${tableName}\` ADD ${definition}`,
    );
  }
};

async function up(connection) {
  if (!(await tableExists(connection, 'favorites'))) {
    await connection.query(`
      CREATE TABLE favorites (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        product_id BIGINT UNSIGNED NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products(id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE KEY uq_favorite_user_product (user_id, product_id),
        INDEX idx_favorites_product (product_id)
      ) ENGINE=InnoDB
    `);
  }

  if (!(await tableExists(connection, 'stores'))) {
    await connection.query(`
      CREATE TABLE stores (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        address_line VARCHAR(255) NOT NULL,
        ward VARCHAR(100),
        district VARCHAR(100),
        province VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        opening_hours VARCHAR(255),
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_stores_status (status),
        INDEX idx_stores_province (province)
      ) ENGINE=InnoDB
    `);
  }

  if (!(await tableExists(connection, 'shipping_methods'))) {
    await connection.query(`
      CREATE TABLE shipping_methods (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255),
        eta_min_days INT UNSIGNED NOT NULL DEFAULT 1,
        eta_max_days INT UNSIGNED NOT NULL DEFAULT 3,
        base_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
        free_shipping_threshold DECIMAL(15,2),
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_shipping_eta CHECK (eta_max_days >= eta_min_days),
        CONSTRAINT chk_shipping_fee CHECK (base_fee >= 0),
        INDEX idx_shipping_status_sort (status, sort_order)
      ) ENGINE=InnoDB
    `);
  }

  if (!(await tableExists(connection, 'promotions'))) {
    await connection.query(`
      CREATE TABLE promotions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        subtitle VARCHAR(255),
        image_url VARCHAR(500),
        target_type ENUM('NONE', 'CATEGORY', 'PRODUCT', 'URL') NOT NULL DEFAULT 'NONE',
        target_value VARCHAR(500),
        start_at DATETIME NOT NULL,
        end_at DATETIME NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT chk_promotions_dates CHECK (end_at > start_at),
        INDEX idx_promotions_active (status, start_at, end_at, sort_order)
      ) ENGINE=InnoDB
    `);
  }

  if (!(await tableExists(connection, 'voucher_usages'))) {
    await connection.query(`
      CREATE TABLE voucher_usages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        voucher_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        order_id BIGINT UNSIGNED NOT NULL,
        used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_voucher_usages_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_voucher_usages_user FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_voucher_usages_order FOREIGN KEY (order_id) REFERENCES orders(id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        UNIQUE KEY uq_voucher_usage_order (voucher_id, order_id),
        INDEX idx_voucher_usage_user (voucher_id, user_id)
      ) ENGINE=InnoDB
    `);
  }

  if (!(await tableExists(connection, 'warranty_requests'))) {
    await connection.query(`
      CREATE TABLE warranty_requests (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        warranty_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        issue VARCHAR(180) NOT NULL,
        description TEXT NOT NULL,
        image_urls JSON,
        preferred_contact ENUM('PHONE', 'EMAIL') NOT NULL DEFAULT 'PHONE',
        status ENUM('RECEIVED', 'INSPECTING', 'REPAIRING', 'COMPLETED', 'REJECTED')
          NOT NULL DEFAULT 'RECEIVED',
        staff_note VARCHAR(500),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_warranty_requests_warranty FOREIGN KEY (warranty_id) REFERENCES warranties(id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        CONSTRAINT fk_warranty_requests_user FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE ON DELETE RESTRICT,
        INDEX idx_warranty_requests_user (user_id, created_at),
        INDEX idx_warranty_requests_status (status)
      ) ENGINE=InnoDB
    `);
  }

  await addColumn(
    connection,
    'orders',
    'fulfillment_method',
    "ENUM('DELIVERY', 'PICKUP') NOT NULL DEFAULT 'DELIVERY' AFTER custom_build_id",
  );
  await addColumn(
    connection,
    'orders',
    'pickup_store_id',
    'BIGINT UNSIGNED NULL AFTER fulfillment_method',
  );
  await addColumn(
    connection,
    'orders',
    'shipping_method_code',
    'VARCHAR(50) NULL AFTER pickup_store_id',
  );
  await addColumn(
    connection,
    'orders',
    'special_requests',
    'JSON NULL AFTER shipping_method_code',
  );
  await addColumn(
    connection,
    'orders',
    'idempotency_key',
    'VARCHAR(80) NULL AFTER voucher_code',
  );
  await addColumn(
    connection,
    'vouchers',
    'user_usage_limit',
    'INT UNSIGNED NULL DEFAULT 1 AFTER usage_limit',
  );

  await addIndex(
    connection,
    'orders',
    'uq_orders_user_idempotency',
    'UNIQUE KEY uq_orders_user_idempotency (user_id, idempotency_key)',
  );
  await addIndex(
    connection,
    'orders',
    'idx_orders_pickup_store',
    'INDEX idx_orders_pickup_store (pickup_store_id)',
  );
  if (!(await constraintExists(connection, 'orders', 'fk_orders_pickup_store'))) {
    await connection.query(`
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_pickup_store
      FOREIGN KEY (pickup_store_id) REFERENCES stores(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);
  }
  if (!(await constraintExists(connection, 'orders', 'fk_orders_shipping_method'))) {
    await connection.query(`
      ALTER TABLE orders
      ADD CONSTRAINT fk_orders_shipping_method
      FOREIGN KEY (shipping_method_code) REFERENCES shipping_methods(code)
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);
  }

  await connection.execute(
    `INSERT INTO categories (name, slug, description, status)
     VALUES ('Điện thoại', 'dien-thoai', 'Điện thoại thông minh và thiết bị di động', 'ACTIVE')
     ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'ACTIVE'`,
  );

  await connection.query(`
    INSERT INTO stores
      (code, name, address_line, ward, district, province, phone,
       latitude, longitude, opening_hours, status)
    VALUES
      ('HCM-Q1', 'BTL Computer Store Quận 1', '123 Nguyễn Thị Minh Khai',
       'Bến Thành', 'Quận 1', 'TP Hồ Chí Minh', '19001001',
       10.7718000, 106.6983000, '08:30 - 21:00', 'ACTIVE'),
      ('HN-CG', 'BTL Computer Store Cầu Giấy', '85 Xuân Thủy',
       'Dịch Vọng Hậu', 'Cầu Giấy', 'Hà Nội', '19001002',
       21.0368000, 105.7827000, '08:30 - 21:00', 'ACTIVE')
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), address_line = VALUES(address_line),
      ward = VALUES(ward), district = VALUES(district),
      province = VALUES(province), phone = VALUES(phone),
      latitude = VALUES(latitude), longitude = VALUES(longitude),
      opening_hours = VALUES(opening_hours), status = 'ACTIVE'
  `);

  await connection.query(`
    INSERT INTO shipping_methods
      (code, name, description, eta_min_days, eta_max_days,
       base_fee, free_shipping_threshold, status, sort_order)
    VALUES
      ('STANDARD', 'Giao hàng tiêu chuẩn', 'Giao trong giờ hành chính', 2, 4, 30000, 20000000, 'ACTIVE', 1),
      ('EXPRESS', 'Giao hàng nhanh', 'Ưu tiên xử lý và vận chuyển', 1, 2, 50000, NULL, 'ACTIVE', 2),
      ('SAME_DAY', 'Giao hỏa tốc', 'Áp dụng tại khu vực được hỗ trợ', 0, 0, 80000, NULL, 'ACTIVE', 3)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name), description = VALUES(description),
      eta_min_days = VALUES(eta_min_days), eta_max_days = VALUES(eta_max_days),
      base_fee = VALUES(base_fee),
      free_shipping_threshold = VALUES(free_shipping_threshold),
      status = 'ACTIVE', sort_order = VALUES(sort_order)
  `);
}

module.exports = { up };

