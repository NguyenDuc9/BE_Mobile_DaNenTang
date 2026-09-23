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
      SELECT ci.id, ci.product_variant_id, ci.quantity, pv.sku, pv.variant_name,
             pv.price, p.id AS product_id, p.name AS product_name
      FROM cart_items ci JOIN carts c ON c.id = ci.cart_id
      JOIN product_variants pv ON pv.id = ci.product_variant_id
      JOIN products p ON p.id = pv.product_id
      WHERE c.id = ? ORDER BY ci.created_at DESC`, [cart.id]);
    return { ...cart, items };
  },
  addItem: async (userId, variantId, quantity) => {
    const cart = await CartModel.findOrCreate(userId);
    await db.promise().execute(`
      INSERT INTO cart_items (cart_id, product_variant_id, quantity) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`, [cart.id, variantId, quantity]);
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
