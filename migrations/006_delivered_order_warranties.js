async function up(connection) {
  await connection.execute(
    `INSERT INTO warranties
       (order_item_id, product_variant_id, serial_number, start_date, end_date, status)
     SELECT oi.id, oi.product_variant_id, NULL, DATE(o.updated_at),
            DATE_ADD(DATE(o.updated_at), INTERVAL pv.warranty_months MONTH), 'ACTIVE'
     FROM orders o
     JOIN order_items oi ON oi.order_id = o.id
     JOIN product_variants pv ON pv.id = oi.product_variant_id
     WHERE o.status IN ('DELIVERED', 'COMPLETED')
       AND pv.warranty_months > 0
       AND NOT EXISTS (
         SELECT 1 FROM warranties existing
         WHERE existing.order_item_id = oi.id
       )`,
  );
}

module.exports = { up };
