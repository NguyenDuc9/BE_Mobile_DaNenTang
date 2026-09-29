const db = require('../common/common');

const ProductVariantModel = {
  // Lấy tất cả variants
  getAll: async () => {
    const [rows] = await db.execute(
      `SELECT *
       FROM product_variants
       ORDER BY id DESC`,
    );

    return rows;
  },

  // Lấy variant theo id
  getById: async (id) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM product_variants
       WHERE id = ?`,
      [id],
    );

    return rows[0];
  },

  // Lấy variants theo product_id
  getByProductId: async (productId) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM product_variants
       WHERE product_id = ?
       ORDER BY id DESC`,
      [productId],
    );

    return rows;
  },

  // Kiểm tra SKU
  getBySku: async (sku) => {
    const [rows] = await db.execute(
      `SELECT *
       FROM product_variants
       WHERE sku = ?`,
      [sku],
    );

    return rows[0];
  },

  // Tạo variant
  create: async (data) => {
    const {
      product_id,
      sku,
      variant_name,
      price,
      compare_at_price,
      stock_quantity,
      cpu,
      ram,
      storage,
      gpu,
      screen_size,
      screen_resolution,
      refresh_rate,
      operating_system,
      color,
      weight_kg,
      warranty_months,
      status,
    } = data;

    const [result] = await db.execute(
      `INSERT INTO product_variants (
        product_id,
        sku,
        variant_name,
        price,
        compare_at_price,
        stock_quantity,
        cpu,
        ram,
        storage,
        gpu,
        screen_size,
        screen_resolution,
        refresh_rate,
        operating_system,
        color,
        weight_kg,
        warranty_months,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_id,
        sku,
        variant_name,
        price ?? 0,
        compare_at_price ?? null,
        stock_quantity ?? 0,
        cpu ?? null,
        ram ?? null,
        storage ?? null,
        gpu ?? null,
        screen_size ?? null,
        screen_resolution ?? null,
        refresh_rate ?? null,
        operating_system ?? null,
        color ?? null,
        weight_kg ?? null,
        warranty_months ?? 12,
        status ?? 'ACTIVE',
      ],
    );

    return result.insertId;
  },

  // Cập nhật variant
  update: async (id, data) => {
    const {
      product_id,
      sku,
      variant_name,
      price,
      compare_at_price,
      stock_quantity,
      cpu,
      ram,
      storage,
      gpu,
      screen_size,
      screen_resolution,
      refresh_rate,
      operating_system,
      color,
      weight_kg,
      warranty_months,
      status,
    } = data;

    const [result] = await db.execute(
      `UPDATE product_variants
       SET product_id = ?,
           sku = ?,
           variant_name = ?,
           price = ?,
           compare_at_price = ?,
           stock_quantity = ?,
           cpu = ?,
           ram = ?,
           storage = ?,
           gpu = ?,
           screen_size = ?,
           screen_resolution = ?,
           refresh_rate = ?,
           operating_system = ?,
           color = ?,
           weight_kg = ?,
           warranty_months = ?,
           status = ?
       WHERE id = ?`,
      [
        product_id,
        sku,
        variant_name,
        price ?? 0,
        compare_at_price ?? null,
        stock_quantity ?? 0,
        cpu ?? null,
        ram ?? null,
        storage ?? null,
        gpu ?? null,
        screen_size ?? null,
        screen_resolution ?? null,
        refresh_rate ?? null,
        operating_system ?? null,
        color ?? null,
        weight_kg ?? null,
        warranty_months ?? 12,
        status ?? 'ACTIVE',
        id,
      ],
    );

    return result.affectedRows;
  },

  // Xóa variant
  delete: async (id) => {
    const [result] = await db.execute(
      `DELETE FROM product_variants
       WHERE id = ?`,
      [id],
    );

    return result.affectedRows;
  },
};

module.exports = ProductVariantModel;
