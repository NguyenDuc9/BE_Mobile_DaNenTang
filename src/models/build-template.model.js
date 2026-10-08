const db = require('../common/common');

const BuildTemplateModel = {
  list: async (includeInactive = false) => {
    const [rows] = await db.promise().execute(
      `SELECT bt.id, bt.name, bt.description, bt.status, bt.estimated_total,
              bt.created_at, bt.updated_at,
              (SELECT COUNT(*) FROM build_template_items bti
               WHERE bti.template_id = bt.id) AS item_count
       FROM build_templates bt
       ${includeInactive ? '' : "WHERE bt.status = 'ACTIVE'"}
       ORDER BY bt.created_at DESC`,
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
          `INSERT INTO build_templates (name, description, status, estimated_total) VALUES (?, ?, 'INACTIVE', ?)`,
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
  delete: async (id) => {
    const [result] = await db.promise().execute(
      'DELETE FROM build_templates WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  },
  listAvailableComponents: async () => {
    const [rows] = await db.promise().execute(
      `SELECT pv.id AS product_variant_id, pv.product_id, pv.variant_name,
              pv.sku, pv.price, pv.stock_quantity, cs.component_type,
              p.name AS product_name
       FROM component_specs cs
       JOIN product_variants pv ON pv.id = cs.product_variant_id
       JOIN products p ON p.id = pv.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE c.slug = 'linh-kien'
         AND pv.status = 'ACTIVE'
         AND p.status = 'ACTIVE'
         AND cs.component_type IN ('CPU', 'MAINBOARD', 'RAM', 'GPU',
                                   'STORAGE', 'PSU', 'CASE', 'COOLER')
       ORDER BY cs.component_type, p.name, pv.variant_name`,
    );
    return rows;
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
         FROM product_variants v
         JOIN products p ON p.id = v.product_id
         JOIN categories c ON c.id = p.category_id
         JOIN component_specs cs ON cs.product_variant_id = v.id
         WHERE v.id = ? AND v.product_id = ?
           AND cs.component_type = ?
           AND c.slug = 'linh-kien'
           AND v.status = 'ACTIVE' AND p.status = 'ACTIVE'`,
        [item.productVariantId, item.productId, item.componentType],
      );
      if (!rows[0]) {
        return {
          error: `Linh kiện ${item.productVariantId} không khớp loại ${item.componentType} hoặc không còn hoạt động`,
        };
      }
      result.push({ ...item, unitPrice: Number(rows[0].price), productName: rows[0].product_name });
    }
    return { items: result };
  },
};
module.exports = BuildTemplateModel;
