const db = require('../common/common');

const AddressModel = {
  // Lấy tất cả địa chỉ của user
  findByUserId: async (userId) => {
    const [rows] = await db.promise().execute(
      `
            SELECT 
                id,
                user_id,
                receiver_name,
                receiver_phone,
                address_line,
                ward,
                district,
                province,
                latitude,
                longitude,
                is_default,
                created_at,
                updated_at
            FROM addresses
            WHERE user_id = ?
            ORDER BY is_default DESC, created_at DESC
            `,
      [userId],
    );

    return rows;
  },

  // Lấy địa chỉ theo ID
  findById: async (id) => {
    const [rows] = await db.promise().execute(
      `
            SELECT 
                id,
                user_id,
                receiver_name,
                receiver_phone,
                address_line,
                ward,
                district,
                province,
                latitude,
                longitude,
                is_default,
                created_at,
                updated_at
            FROM addresses
            WHERE id = ?
            `,
      [id],
    );

    return rows[0];
  },

  // Tạo địa chỉ
  create: async (data) => {
    const {
      user_id,
      receiver_name,
      receiver_phone,
      address_line,
      ward,
      district,
      province,
      latitude,
      longitude,
      is_default,
    } = data;

    const [result] = await db.promise().execute(
      `
            INSERT INTO addresses (
                user_id,
                receiver_name,
                receiver_phone,
                address_line,
                ward,
                district,
                province,
                latitude,
                longitude,
                is_default
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
      [
        user_id,
        receiver_name,
        receiver_phone,
        address_line,
        ward || null,
        district || null,
        province,
        latitude ?? null,
        longitude ?? null,
        is_default ?? false,
      ],
    );

    return result.insertId;
  },

  // Cập nhật địa chỉ
  update: async (id, data) => {
    const {
      receiver_name,
      receiver_phone,
      address_line,
      ward,
      district,
      province,
      latitude,
      longitude,
      is_default,
    } = data;

    const [result] = await db.promise().execute(
      `
            UPDATE addresses
            SET
                receiver_name = ?,
                receiver_phone = ?,
                address_line = ?,
                ward = ?,
                district = ?,
                province = ?,
                latitude = ?,
                longitude = ?,
                is_default = ?
            WHERE id = ?
            `,
      [
        receiver_name,
        receiver_phone,
        address_line,
        ward || null,
        district || null,
        province,
        latitude ?? null,
        longitude ?? null,
        is_default ?? false,
        id,
      ],
    );

    return result.affectedRows;
  },

  // Xóa địa chỉ
  delete: async (id) => {
    const [result] = await db.promise().execute(
      `
            DELETE FROM addresses
            WHERE id = ?
            `,
      [id],
    );

    return result.affectedRows;
  },

  // Bỏ mặc định tất cả địa chỉ của user
  clearDefaultByUserId: async (userId) => {
    await db.promise().execute(
      `
            UPDATE addresses
            SET is_default = FALSE
            WHERE user_id = ?
            `,
      [userId],
    );
  },

  // Đặt địa chỉ thành mặc định
  setDefault: async (id) => {
    const [result] = await db.promise().execute(
      `
            UPDATE addresses
            SET is_default = TRUE
            WHERE id = ?
            `,
      [id],
    );

    return result.affectedRows;
  },
};

module.exports = AddressModel;
