const db = require('../common/common');
const WarrantyModel = {
  list: async (userId, staff) => {
    const sql = staff ? 'SELECT * FROM warranties ORDER BY created_at DESC' :
      `SELECT w.* FROM warranties w JOIN order_items oi ON oi.id=w.order_item_id
       JOIN orders o ON o.id=oi.order_id WHERE o.user_id=? ORDER BY w.created_at DESC`;
    const [r] = await db.promise().execute(sql, staff ? [] : [userId]); return r;
  },
  find: async (id, userId, staff) => {
    const sql = staff ? 'SELECT * FROM warranties WHERE id=?' :
      `SELECT w.* FROM warranties w JOIN order_items oi ON oi.id=w.order_item_id
       JOIN orders o ON o.id=oi.order_id WHERE w.id=? AND o.user_id=?`;
    const [r] = await db.promise().execute(sql, staff ? [id] : [id, userId]); return r[0];
  },
  bySerial: async (serial) => { const [r] = await db.promise().execute('SELECT * FROM warranties WHERE serial_number=?', [serial]); return r[0]; },
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
