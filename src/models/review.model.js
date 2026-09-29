const db = require('../common/common');

const ReviewModel = {
  // Lấy tất cả reviews
  getAll: async () => {
    const [rows] = await db.execute(
      `SELECT *
       FROM reviews
       ORDER BY id DESC`,
    );

    return rows;
  },

  // Lấy review theo id
  getById: async (id) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM reviews
       WHERE id = ?`,
      [id],
    );

    return rows[0];
  },

  // Lấy reviews theo product
  getByProductId: async (productId) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM reviews
       WHERE product_id = ?
       ORDER BY created_at DESC`,
      [productId],
    );

    return rows;
  },

  // Lấy reviews theo user
  getByUserId: async (userId) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM reviews
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

    return rows;
  },

  // Kiểm tra review theo user + product
  getByUserAndProduct: async (userId, productId) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM reviews
       WHERE user_id = ?
       AND product_id = ?
       ORDER BY id DESC`,
      [userId, productId],
    );

    return rows;
  },

  // Lấy review theo order_item
  getByOrderItemId: async (orderItemId) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM reviews
       WHERE order_item_id = ?
       ORDER BY id DESC`,
      [orderItemId],
    );

    return rows;
  },

  // Tạo review
  create: async (data) => {
    const { user_id, product_id, order_item_id, rating, comment, status } =
      data;

    const [result] = await db.execute(
      `INSERT INTO reviews (
        user_id,
        product_id,
        order_item_id,
        rating,
        comment,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        product_id,
        order_item_id ?? null,
        rating,
        comment ?? null,
        status ?? 'PENDING',
      ],
    );

    return result.insertId;
  },

  // Cập nhật review
  update: async (id, data) => {
    const { product_id, order_item_id, rating, comment, status } = data;

    const [result] = await db.execute(
      `UPDATE reviews
       SET product_id = ?,
           order_item_id = ?,
           rating = ?,
           comment = ?,
           status = ?
       WHERE id = ?`,
      [product_id, order_item_id ?? null, rating, comment ?? null, status, id],
    );

    return result.affectedRows;
  },

  // Xóa review
  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM reviews
       WHERE id = ?`,
      [id],
    );

    return result.affectedRows;
  },
};

module.exports = ReviewModel;
