const db = require('../common/common');
const warrantyDetails = `SELECT w.*, oi.product_name, oi.variant_name, oi.sku,
       o.order_code, o.id AS order_id, o.user_id, pv.sku AS variant_sku,
       COALESCE(
         NULLIF(p.thumbnail_url, ''),
         (
           SELECT pi.image_url
           FROM product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
           LIMIT 1
         )
       ) AS thumbnail_url
     FROM warranties w
     JOIN order_items oi ON oi.id = w.order_item_id
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id
     LEFT JOIN products p ON p.id = pv.product_id`;

const WarrantyModel = {
  list: async (userId, staff) => {
    const sql = `${warrantyDetails}
       ${staff ? '' : 'WHERE o.user_id=?'}
       ORDER BY w.created_at DESC`;
    const [r] = await db.promise().execute(sql, staff ? [] : [userId]); return r;
  },
  find: async (id, userId, staff) => {
    const sql = `${warrantyDetails}
       WHERE w.id=? ${staff ? '' : 'AND o.user_id=?'}`;
    const [r] = await db.promise().execute(sql, staff ? [id] : [id, userId]); return r[0];
  },
  bySerial: async (serial) => {
    const [r] = await db.promise().execute(
      `${warrantyDetails} WHERE w.serial_number=?`,
      [serial],
    );
    return r[0];
  },
  create: async (d) => {
    const [r] = await db.promise().execute(
      `INSERT INTO warranties (order_item_id, product_variant_id, serial_number, start_date, end_date, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [d.orderItemId, d.productVariantId || null, d.serialNumber, d.startDate, d.endDate, d.status || 'ACTIVE', d.notes || null],
    ); return r.insertId;
  },
  update: async (id, d) => {
    const [r] = await db.promise().execute(
      `UPDATE warranties SET serial_number=?, start_date=?, end_date=?, status=?, note=? WHERE id=?`,
      [d.serialNumber, d.startDate, d.endDate, d.status, d.notes || null, id],
    ); return r.affectedRows;
  },
};
module.exports = WarrantyModel;
