const db = require('../common/common');

const ProductImageModel = {
  // Lấy tất cả ảnh
  getAll: async () => {
    const [rows] = await db.execute(
      `SELECT * FROM product_images
       ORDER BY product_id ASC, sort_order ASC, id ASC`,
    );

    return rows;
  },

  // Lấy ảnh theo id
  getById: async (id) => {
    const [rows] = await db.execute(
      `SELECT * FROM product_images
       WHERE id = ?`,
      [id],
    );

    return rows[0];
  },

  // Lấy tất cả ảnh của một product
  getByProductId: async (productId) => {
    const [rows] = await db.execute(
      `SELECT * FROM product_images
       WHERE product_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [productId],
    );

    return rows;
  },

  // Tạo ảnh
  create: async (data) => {
    const { product_id, image_url, sort_order, is_primary } = data;

    const [result] = await db.execute(
      `INSERT INTO product_images
      (
        product_id,
        image_url,
        sort_order,
        is_primary
      )
      VALUES (?, ?, ?, ?)`,
      [product_id, image_url, sort_order ?? 0, is_primary ?? false],
    );

    return result.insertId;
  },

  // Cập nhật ảnh
  update: async (id, data) => {
    const { product_id, image_url, sort_order, is_primary } = data;

    const [result] = await db.execute(
      `UPDATE product_images
       SET product_id = ?,
           image_url = ?,
           sort_order = ?,
           is_primary = ?
       WHERE id = ?`,
      [product_id, image_url, sort_order ?? 0, is_primary ?? false, id],
    );

    return result.affectedRows;
  },

  // Xóa ảnh
  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM product_images
       WHERE id = ?`,
      [id],
    );

    return result.affectedRows;
  },
};

module.exports = ProductImageModel;
