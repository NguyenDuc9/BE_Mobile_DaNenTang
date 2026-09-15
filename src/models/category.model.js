const db = require('../common/common');

const CategoryModel = {
  findAll: async () => {
    const [rows] = await db.promise().execute(`
      SELECT id, name, slug, description, image_url, status, created_at, updated_at
      FROM categories
      ORDER BY created_at DESC
    `);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.promise().execute(
      `
        SELECT id, name, slug, description, image_url, status, created_at, updated_at
        FROM categories
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    );
    return rows[0];
  },

  create: async ({ name, slug, description, imageUrl, status }) => {
    const [result] = await db.promise().execute(
      `
        INSERT INTO categories (name, slug, description, image_url, status)
        VALUES (?, ?, ?, ?, ?)
      `,
      [name, slug, description || null, imageUrl || null, status || 'ACTIVE'],
    );
    return result.insertId;
  },

  update: async (id, { name, slug, description, imageUrl, status }) => {
    const [result] = await db.promise().execute(
      `
        UPDATE categories
        SET name = ?, slug = ?, description = ?, image_url = ?, status = ?
        WHERE id = ?
      `,
      [name, slug, description || null, imageUrl || null, status, id],
    );
    return result.affectedRows;
  },

  remove: async (id) => {
    const [result] = await db.promise().execute(
      'DELETE FROM categories WHERE id = ?',
      [id],
    );
    return result.affectedRows;
  },
};

module.exports = CategoryModel;
