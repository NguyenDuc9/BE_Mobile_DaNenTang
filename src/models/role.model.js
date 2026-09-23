const db = require('../common/common');

const RoleModel = {
  // Lấy tất cả roles
  findAll: async () => {
    const [rows] = await db.promise().execute(`
      SELECT id, name, description, created_at
      FROM roles
      ORDER BY created_at DESC
    `);

    return rows;
  },

  // Lấy role theo ID
  findById: async (id) => {
    const [rows] = await db.promise().execute(
      `
        SELECT id, name, description, created_at
        FROM roles
        WHERE id = ?
        LIMIT 1
      `,
      [id],
    );

    return rows[0];
  },

  // Tạo role
  create: async ({ name, description }) => {
    const [result] = await db.promise().execute(
      `
        INSERT INTO roles (name, description)
        VALUES (?, ?)
      `,
      [name, description || null],
    );

    return result.insertId;
  },

  // Cập nhật role
  update: async (id, { name, description }) => {
    const [result] = await db.promise().execute(
      `
        UPDATE roles
        SET name = ?, description = ?
        WHERE id = ?
      `,
      [name, description || null, id],
    );

    return result.affectedRows;
  },

  // Xóa role
  remove: async (id) => {
    const [result] = await db
      .promise()
      .execute('DELETE FROM roles WHERE id = ?', [id]);

    return result.affectedRows;
  },
};

module.exports = RoleModel;
