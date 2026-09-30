const db = require('../common/common');

const selectComponents = `
  SELECT cs.*, p.id, pv.id AS variant_id, pv.product_id,
         pv.sku, pv.variant_name, pv.price,
         pv.compare_at_price, pv.stock_quantity, pv.ram, pv.storage, pv.gpu,
         pv.color, pv.warranty_months, p.name, p.description, p.thumbnail_url,
         p.category_id, c.name AS category_name, c.slug AS category_slug,
         p.brand_id, b.name AS brand_name
  FROM component_specs cs
  JOIN product_variants pv ON pv.id = cs.product_variant_id
  JOIN products p ON p.id = pv.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN brands b ON b.id = p.brand_id
  WHERE pv.status = 'ACTIVE' AND p.status = 'ACTIVE'
`;

const list = async () => {
  const [rows] = await db.promise().execute(
    `${selectComponents} ORDER BY cs.component_type, pv.price, pv.id`,
  );
  return rows;
};

const findByVariantIds = async (variantIds) => {
  if (!variantIds.length) return [];
  const placeholders = variantIds.map(() => '?').join(',');
  const [rows] = await db.promise().execute(
    `${selectComponents} AND pv.id IN (${placeholders})`,
    variantIds,
  );
  return rows;
};

module.exports = { list, findByVariantIds };

