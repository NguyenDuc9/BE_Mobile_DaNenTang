const db = require('../common/common');
const CustomBuildModel = {
  list: async (userId) => {
    const [rows] = await db.promise().execute('SELECT * FROM custom_builds WHERE user_id=? ORDER BY created_at DESC', [userId]);
    return rows;
  },
  find: async (id, userId) => {
    const [b] = await db.promise().execute('SELECT * FROM custom_builds WHERE id=? AND user_id=?', [id, userId]);
    if (!b[0]) return null;
    const [items] = await db.promise().execute('SELECT * FROM custom_build_items WHERE custom_build_id=? ORDER BY id', [id]);
    return { ...b[0], items };
  },
  create: async (userId, data) => {
    const [r] = await db.promise().execute(
      `INSERT INTO custom_builds (user_id, name, status, base_price, discount_amount, total_amount)
       VALUES (?, ?, 'DRAFT', 0, 0, 0)`, [userId, data.name || 'Custom build'],
    );
    return r.insertId;
  },
  replaceItems: async (id, userId, items) => {
    return db.withTransaction(async (conn) => {
      const [build] = await conn.execute('SELECT id,status FROM custom_builds WHERE id=? AND user_id=? FOR UPDATE', [id, userId]);
      if (!build[0]) return null;
      if (build[0].status !== 'DRAFT') { const e = new Error('Build đã submit không thể sửa'); e.status = 409; throw e; }
      await conn.execute('DELETE FROM custom_build_items WHERE custom_build_id=?', [id]);
      let total = 0;
      for (const item of items) {
        const [v] = await conn.execute(
          `SELECT v.id,v.product_id,v.sku,v.price,p.name AS product_name
           FROM product_variants v JOIN products p ON p.id=v.product_id
           WHERE v.id=? AND v.status='ACTIVE' AND p.status='ACTIVE'`, [item.productVariantId],
        );
        if (!v[0]) { const e = new Error('Variant không tồn tại hoặc không ACTIVE'); e.status = 400; throw e; }
        const qty = item.quantity; const line = Number(v[0].price) * qty; total += line;
        await conn.execute(
          `INSERT INTO custom_build_items
           (custom_build_id, product_id, product_variant_id, component_type, product_name,
            variant_name, sku, unit_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, v[0].product_id, v[0].id, item.componentType, v[0].product_name,
            item.variantName || null, v[0].sku, v[0].price, qty, line],
        );
      }
      await conn.execute('UPDATE custom_builds SET base_price=?, total_amount=? WHERE id=?', [total, total, id]);
      return total;
    });
  },
  submit: async (id, userId) => {
    const [r] = await db.promise().execute("UPDATE custom_builds SET status='PENDING' WHERE id=? AND user_id=? AND status='DRAFT'", [id, userId]);
    return r.affectedRows;
  },
};
module.exports = CustomBuildModel;
