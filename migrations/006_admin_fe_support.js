async function up(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS voucher_products (
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
    ) ENGINE=InnoDB
  `);
}

module.exports = { up };
