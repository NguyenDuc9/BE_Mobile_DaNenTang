const db = require('../common/common');
const normalizeCode = (code) => String(code || '').trim().toUpperCase();
const VoucherModel = {
  normalizeCode,
  list: async (availableOnly = false) => {
    const where = availableOnly ? `WHERE status = 'ACTIVE' AND start_at <= NOW() AND end_at >= NOW() AND (usage_limit IS NULL OR used_count < usage_limit)` : '';
    const [rows] = await db.promise().execute(`SELECT id, code, name, description, discount_type, discount_value, min_order_value, max_discount, start_at, end_at, usage_limit, used_count, status, created_at, updated_at FROM vouchers ${where} ORDER BY created_at DESC`);
    return rows;
  },
  findByCode: async (code) => {
    const [rows] = await db.promise().execute('SELECT * FROM vouchers WHERE code = ? LIMIT 1', [normalizeCode(code)]);
    return rows[0];
  },
  create: async (data) => {
    const [r] = await db.promise().execute(`INSERT INTO vouchers (code, name, description, discount_type, discount_value, min_order_value, max_discount, start_at, end_at, usage_limit, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [normalizeCode(data.code), data.name || data.code, data.description || null, data.type, data.value, data.min_order_amount || 0, data.max_discount_amount || null, data.start_at, data.end_at, data.usage_limit || null, data.status || 'ACTIVE']);
    return r.insertId;
  },
  update: async (id, data) => {
    const [r] = await db.promise().execute(`UPDATE vouchers SET code=?, name=?, description=?, discount_type=?, discount_value=?, min_order_value=?, max_discount=?, start_at=?, end_at=?, usage_limit=? WHERE id=?`,
      [normalizeCode(data.code), data.name || data.code, data.description || null, data.type, data.value, data.min_order_amount || 0, data.max_discount_amount || null, data.start_at, data.end_at, data.usage_limit || null, id]);
    return r.affectedRows;
  },
  setStatus: async (id, status) => {
    const [r] = await db.promise().execute('UPDATE vouchers SET status = ? WHERE id = ?', [status, id]);
    return r.affectedRows;
  },
};
module.exports = VoucherModel;
