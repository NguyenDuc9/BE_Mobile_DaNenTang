const db = require('../common/common');
const { fail, idOf } = require('./order.service');
const types = ['IMPORT', 'ADJUSTMENT'];

const list = async () => {
  const [rows] = await db.promise().execute(
    `SELECT it.*, pv.sku, pv.variant_name
     FROM inventory_transactions it
     JOIN product_variants pv ON pv.id = it.product_variant_id
     ORDER BY it.created_at DESC`,
  );
  return rows;
};

const change = async (userId, body) => {
  const variantId = idOf(body.productVariantId, 'productVariantId');
  const quantity = Number(body.quantity);
  const type = body.type || 'IMPORT';
  if (!types.includes(type) || !Number.isInteger(quantity) || quantity <= 0) {
    fail('type hoặc quantity không hợp lệ', 400);
  }
  return db.withTransaction(async (connection) => {
    const [variants] = await connection.execute(
      'SELECT stock_quantity FROM product_variants WHERE id = ? FOR UPDATE',
      [variantId],
    );
    if (!variants[0]) fail('Không tìm thấy variant', 404);
    const delta = type === 'IMPORT' ? quantity : Number(body.delta);
    if (!Number.isInteger(delta) || delta === 0) fail('delta phải là số nguyên khác 0', 400);
    const next = Number(variants[0].stock_quantity) + delta;
    if (next < 0) fail('Tồn kho không được âm', 409);
    await connection.execute('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [next, variantId]);
    await connection.execute(
      `INSERT INTO inventory_transactions
       (product_variant_id, user_id, type, quantity, reference_type, note)
       VALUES (?, ?, ?, ?, 'MANUAL', ?)`,
      [variantId, userId, type, delta, body.note || null],
    );
    return { productVariantId: variantId, stockQuantity: next };
  });
};
module.exports = { list, change };
