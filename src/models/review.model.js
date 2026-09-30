const db = require('../common/common');

const ReviewModel = {
  listApproved: async (productId, limit, offset) => {
    const [rows] = await db.promise().execute(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.full_name AS reviewer_name,
              (r.order_item_id IS NOT NULL) AS verified_purchase
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.status = 'APPROVED'
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [productId, limit, offset],
    );
    const [summaryRows] = await db.promise().execute(
      `SELECT COUNT(*) AS total, COALESCE(AVG(rating), 0) AS average
       FROM reviews WHERE product_id = ? AND status = 'APPROVED'`,
      [productId],
    );
    return {
      items: rows,
      total: Number(summaryRows[0].total),
      average: Number(summaryRows[0].average),
    };
  },

  eligibleOrderItems: async (userId, productId) => {
    const [rows] = await db.promise().execute(
      `SELECT oi.id AS order_item_id, oi.variant_name, oi.sku,
              o.id AS order_id, o.order_code, o.created_at
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN product_variants pv ON pv.id = oi.product_variant_id
       LEFT JOIN reviews r ON r.user_id = o.user_id AND r.order_item_id = oi.id
       WHERE o.user_id = ? AND pv.product_id = ?
         AND o.status IN ('DELIVERED', 'COMPLETED')
         AND r.id IS NULL
       ORDER BY o.created_at DESC`,
      [userId, productId],
    );
    return rows;
  },

  findEligibleOrderItem: async (userId, productId, orderItemId) => {
    const [rows] = await db.promise().execute(
      `SELECT oi.id
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN product_variants pv ON pv.id = oi.product_variant_id
       WHERE oi.id = ? AND o.user_id = ? AND pv.product_id = ?
         AND o.status IN ('DELIVERED', 'COMPLETED')
       LIMIT 1`,
      [orderItemId, userId, productId],
    );
    return rows[0];
  },

  create: async ({ userId, productId, orderItemId, rating, comment }) => {
    const [result] = await db.promise().execute(
      `INSERT INTO reviews
         (user_id, product_id, order_item_id, rating, comment, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [userId, productId, orderItemId, rating, comment || null],
    );
    return result.insertId;
  },

  updateOwnPending: async (id, userId, rating, comment) => {
    const [result] = await db.promise().execute(
      `UPDATE reviews SET rating = ?, comment = ?
       WHERE id = ? AND user_id = ? AND status = 'PENDING'`,
      [rating, comment || null, id, userId],
    );
    return result.affectedRows;
  },

  removeOwnPending: async (id, userId) => {
    const [result] = await db.promise().execute(
      `DELETE FROM reviews WHERE id = ? AND user_id = ? AND status = 'PENDING'`,
      [id, userId],
    );
    return result.affectedRows;
  },

  setStatus: async (id, status) => {
    const [result] = await db.promise().execute(
      'UPDATE reviews SET status = ? WHERE id = ?',
      [status, id],
    );
    return result.affectedRows;
  },
};

module.exports = ReviewModel;

