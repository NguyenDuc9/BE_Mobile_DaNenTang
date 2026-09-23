const db = require('../common/common');

const UserModel = {
  findByEmail: async (email) => {
    const query = `
      SELECT u.id, u.role_id, u.full_name, u.email, u.password_hash, u.status, r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
      LIMIT 1
    `;
    const [rows] = await db.promise().execute(query, [email]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await db.promise().execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url, u.status,
              r.name AS role_name
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? LIMIT 1`,
      [id],
    );
    return rows[0];
  },

  create: async ({ roleId, fullName, email, phone, passwordHash }) => {
    const query = `
      INSERT INTO users (role_id, full_name, email, phone, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db
      .promise()
      .execute(query, [roleId, fullName, email, phone || null, passwordHash]);
    return result.insertId;
  },

  findRoleByName: async (name) => {
    await db
      .promise()
      .execute('INSERT IGNORE INTO roles (name, description) VALUES (?, ?)', [
        name,
        name === 'USER' ? 'Người dùng thông thường' : null,
      ]);
    const [rows] = await db
      .promise()
      .execute('SELECT id, name FROM roles WHERE name = ? LIMIT 1', [name]);
    return rows[0];
  },
};

module.exports = UserModel;
