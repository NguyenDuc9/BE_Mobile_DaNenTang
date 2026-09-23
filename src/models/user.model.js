const db = require('../common/common');

const UserModel = {
  findAll: async () => {
    const [rows] = await db.promise().execute(`
			SELECT u.id, u.role_id, r.name AS role_name, u.full_name, u.email,
						 u.phone, u.avatar_url, u.status, u.created_at, u.updated_at
			FROM users u
			JOIN roles r ON u.role_id = r.id
			ORDER BY u.created_at DESC
		`);

    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.promise().execute(
      `
				SELECT u.id, u.role_id, r.name AS role_name, u.full_name, u.email,
							 u.phone, u.avatar_url, u.status, u.created_at, u.updated_at
				FROM users u
				JOIN roles r ON u.role_id = r.id
				WHERE u.id = ?
				LIMIT 1
			`,
      [id],
    );

    return rows[0];
  },

  create: async ({
    roleId,
    fullName,
    email,
    phone,
    passwordHash,
    avatarUrl,
    status,
  }) => {
    const [result] = await db.promise().execute(
      `
				INSERT INTO users
					(role_id, full_name, email, phone, password_hash, avatar_url, status)
				VALUES (?, ?, ?, ?, ?, ?, ?)
			`,
      [
        roleId,
        fullName,
        email,
        phone || null,
        passwordHash,
        avatarUrl || null,
        status || 'ACTIVE',
      ],
    );

    return result.insertId;
  },

  update: async (
    id,
    { roleId, fullName, email, phone, passwordHash, avatarUrl, status },
  ) => {
    const fields = [
      'role_id = ?',
      'full_name = ?',
      'email = ?',
      'phone = ?',
      'avatar_url = ?',
      'status = ?',
    ];
    const values = [
      roleId,
      fullName,
      email,
      phone || null,
      avatarUrl || null,
      status,
    ];

    if (passwordHash !== undefined) {
      fields.push('password_hash = ?');
      values.push(passwordHash);
    }

    values.push(id);
    const [result] = await db
      .promise()
      .execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    return result.affectedRows;
  },

  remove: async (id) => {
    const [result] = await db
      .promise()
      .execute('DELETE FROM users WHERE id = ?', [id]);

    return result.affectedRows;
  },
};

module.exports = UserModel;
