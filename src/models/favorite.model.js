const db = require('../common/common');

const FavoriteModel = {
  // Lấy tất cả favorites
  getAll: async () => {
    const [rows] = await db.execute(
      `SELECT *
       FROM favorites
       ORDER BY id DESC`,
    );

    return rows;
  },

  // Lấy favorite theo id
  getById: async (id) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM favorites
       WHERE id = ?`,
      [id],
    );

    return rows[0];
  },

  // Lấy danh sách favorite của user
  getByUserId: async (userId) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM favorites
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId],
    );

    return rows;
  },

  // Kiểm tra user đã favorite product chưa
  getByUserAndProduct: async (userId, productId) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM favorites
       WHERE user_id = ?
       AND product_id = ?`,
      [userId, productId],
    );

    return rows[0];
  },

  // Thêm favorite
  create: async (data) => {
    const { user_id, product_id } = data;

    const [result] = await db.execute(
      `INSERT INTO favorites
       (user_id, product_id)
       VALUES (?, ?)`,
      [user_id, product_id],
    );

    return result.insertId;
  },

  // Xóa favorite
  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM favorites
       WHERE id = ?`,
      [id],
    );

    return result.affectedRows;
  },

  // Xóa favorite theo user + product
  deleteByUserAndProduct: async (userId, productId) => {
    const [result] = await db.execute(
      `DELETE FROM favorites
       WHERE user_id = ?
       AND product_id = ?`,
      [userId, productId],
    );

    return result.affectedRows;
  },
};

module.exports = FavoriteModel;
