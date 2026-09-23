const db = require('../common/common');

const BuildTemplateModel = {
  list: async (includeInactive = false) => {
    const [rows] = await db.promise().execute(
      `SELECT id, name, description, status, estimated_total, created_at, updated_at
       FROM build_templates ${includeInactive ? '' : "WHERE status = 'ACTIVE'"} ORDER BY created_at DESC`,
    );
    return rows;
  },
  find: async (id) => {
    const [templates] = await db.promise().execute('SELECT * FROM build_templates WHERE id = ?', [id]);
    if (!templates[0]) return null;
    const [items] = await db.promise().execute(
      `SELECT id, product_id, product_variant_id, component_type, quantity, sort_order
       FROM build_template_items WHERE template_id = ? ORDER BY sort_order, id`, [id],
    );
    return { ...templates[0], items };
  },
  save: async (data, id) => {
    return db.withTransaction(async (conn) => {
      let templateId = id;
      if (id) {
        const [r] = await conn.execute(
          'UPDATE build_templates SET name=?, description=?, estimated_total=? WHERE id=?',
          [data.name, data.description || null, data.estimatedTotal, id],
        );
        if (!r.affectedRows) return null;
        await conn.execute('DELETE FROM build_template_items WHERE template_id=?', [id]);
      } else {
        const [r] = await conn.execute(
          `INSERT INTO build_templates (name, description, status, estimated_total) VALUES (?, ?, 'DRAFT', ?)`,
          [data.name, data.description || null, data.estimatedTotal],
        );
        templateId = r.insertId;
      }
      for (const item of data.items) {
        await conn.execute(
          `INSERT INTO build_template_items
           (template_id, product_id, product_variant_id, component_type, quantity, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [templateId, item.productId, item.productVariantId, item.componentType, item.quantity, item.sortOrder || 0],
        );
      }
      return templateId;
    });
  },
  setStatus: async (id, status) => {
    const [r] = await db.promise().execute('UPDATE build_templates SET status=? WHERE id=?', [status, id]);
    return r.affectedRows;
  },
  validateItems: async (items) => {
    const result = [];
    for (const item of items) {
      const [rows] = await db.promise().execute(
        `SELECT v.id, v.product_id, v.price, p.name AS product_name
         FROM product_variants v JOIN products p ON p.id=v.product_id
         WHERE v.id=? AND v.product_id=? AND v.status='ACTIVE' AND p.status='ACTIVE'`, [item.productVariantId, item.productId],
      );
      if (!rows[0]) return { error: `variant ${item.productVariantId} không thuộc product hoặc không ACTIVE` };
      result.push({ ...item, unitPrice: Number(rows[0].price), productName: rows[0].product_name });
    }
    return { items: result };
  },
};
module.exports = BuildTemplateModel;
