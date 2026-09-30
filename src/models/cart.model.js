const db = require('../common/common');

const CartModel = {
  findOrCreate: async (userId) => {
    await db.promise().execute('INSERT IGNORE INTO carts (user_id) VALUES (?)', [userId]);
    const [rows] = await db.promise().execute('SELECT id, user_id, created_at, updated_at FROM carts WHERE user_id = ? LIMIT 1', [userId]);
    return rows[0];
  },
  findWithItems: async (userId) => {
    const cart = await CartModel.findOrCreate(userId);
    const [items] = await db.promise().execute(`
      SELECT ci.id, ci.product_variant_id, ci.item_type, ci.configuration_key,
             ci.configuration_json, ci.price_adjustment, ci.quantity,
             pv.sku, pv.variant_name,
             (pv.price + ci.price_adjustment) AS price,
             (COALESCE(pv.compare_at_price, pv.price) + ci.price_adjustment) AS compare_at_price,
             pv.price AS base_price, pv.stock_quantity,
             pv.warranty_months, pv.status AS variant_status,
             p.id AS product_id, p.name AS product_name, p.thumbnail_url,
             p.status AS product_status
      FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
      JOIN product_variants pv ON pv.id = ci.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE c.id = ? ORDER BY ci.created_at DESC`, [cart.id]);
    return { ...cart, items };
  },
  findOwnedItemWithStock: async (userId, itemId) => {
    const [rows] = await db.promise().execute(
      `SELECT ci.id, ci.quantity, pv.stock_quantity
       FROM cart_items ci
       JOIN carts c ON c.id = ci.cart_id
       JOIN product_variants pv ON pv.id = ci.product_variant_id
       WHERE ci.id = ? AND c.user_id = ?
       LIMIT 1`,
      [itemId, userId],
    );
    return rows[0];
  },
  addItem: async (userId, variantId, quantity, configured = {}) => {
    const cart = await CartModel.findOrCreate(userId);
    await db.promise().execute(`
      INSERT INTO cart_items
        (cart_id, product_variant_id, item_type, configuration_key,
         configuration_json, price_adjustment, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`, [
      cart.id,
      variantId,
      configured.itemType || 'PRODUCT',
      configured.configurationKey || '',
      configured.configuration ? JSON.stringify(configured.configuration) : null,
      configured.priceAdjustment || 0,
      quantity,
    ]);
    return CartModel.findWithItems(userId);
  },
  updateItem: async (userId, itemId, quantity) => {
    const [result] = await db.promise().execute(`
      UPDATE cart_items ci JOIN carts c ON c.id = ci.cart_id
      SET ci.quantity = ? WHERE ci.id = ? AND c.user_id = ?`, [quantity, itemId, userId]);
    return result.affectedRows;
  },
  removeItem: async (userId, itemId) => {
    const [result] = await db.promise().execute(`
      DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
      WHERE ci.id = ? AND c.user_id = ?`, [itemId, userId]);
    return result.affectedRows;
  },
  clear: async (userId) => {
    const [result] = await db.promise().execute('DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.user_id = ?', [userId]);
    return result.affectedRows;
  },
};
module.exports = CartModel;
