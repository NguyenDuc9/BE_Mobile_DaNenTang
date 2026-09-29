const db = require('../common/common');

const BrandModel = {
  // Lấy tất cả brands
  getAll: async () => {
    const [rows] = await db.execute('SELECT * FROM brands ORDER BY id DESC');
    return rows;
  },

  // Lấy brand theo id
  getById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM brands WHERE id = ?', [id]);
    return rows[0];
  },

  // Tạo brand
  create: async (data) => {
    const { name, slug, logo_url, description, status } = data;

    const [result] = await db.execute(
      `INSERT INTO brands 
      (name, slug, logo_url, description, status)
      VALUES (?, ?, ?, ?, ?)`,
      [name, slug, logo_url || null, description || null, status || 'ACTIVE'],
    );

    return result.insertId;
  },

  // Cập nhật brand
  update: async (id, data) => {
    const { name, slug, logo_url, description, status } = data;

    const [result] = await db.execute(
      `UPDATE brands
       SET name = ?,
           slug = ?,
           logo_url = ?,
           description = ?,
           status = ?
       WHERE id = ?`,
      [name, slug, logo_url || null, description || null, status, id],
    );

    return result.affectedRows;
  },

  // Xóa brand
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM brands WHERE id = ?', [id]);

    return result.affectedRows;
  },
};

module.exports = BrandModel;
