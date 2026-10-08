const db = require('../common/common');

const selectFavorite = `
  SELECT f.id AS favorite_id, f.created_at AS favorited_at,
         p.id, p.category_id, c.name AS category_name, c.slug AS category_slug,
         p.brand_id, b.name AS brand_name, p.name, p.slug, p.description,
         COALESCE(
           NULLIF(p.thumbnail_url, ''),
           (
             SELECT pi.image_url
             FROM product_images pi
             WHERE pi.product_id = p.id
             ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
             LIMIT 1
           )
         ) AS thumbnail_url,
         p.status,
         pv.id AS variant_id, pv.sku, pv.variant_name, pv.price,
         pv.compare_at_price, pv.stock_quantity, pv.cpu, pv.ram, pv.storage,
         pv.gpu, pv.screen_size, pv.screen_resolution, pv.refresh_rate,
         pv.operating_system, pv.color, pv.weight_kg, pv.warranty_months,
         pv.status AS variant_status
  FROM favorites f
  JOIN products p ON p.id = f.product_id
  JOIN categories c ON c.id = p.category_id
  JOIN brands b ON b.id = p.brand_id
  JOIN product_variants pv ON pv.id = (
    SELECT candidate.id FROM product_variants candidate
    WHERE candidate.product_id = p.id AND candidate.status = 'ACTIVE'
    ORDER BY (candidate.stock_quantity > 0) DESC, candidate.price ASC, candidate.id ASC
    LIMIT 1
  )
`;

const FavoriteModel = {
  list: async (userId) => {
    const [rows] = await db.promise().execute(
      `${selectFavorite}
       WHERE f.user_id = ? AND p.status = 'ACTIVE' AND c.status = 'ACTIVE'
       ORDER BY f.created_at DESC`,
      [userId],
    );
    return rows;
  },

  exists: async (userId, productId) => {
    const [rows] = await db.promise().execute(
      'SELECT id FROM favorites WHERE user_id = ? AND product_id = ? LIMIT 1',
      [userId, productId],
    );
    return Boolean(rows[0]);
  },

  add: async (userId, productId) => {
    const [result] = await db.promise().execute(
      `INSERT INTO favorites (user_id, product_id)
       SELECT ?, p.id FROM products p
       WHERE p.id = ? AND p.status = 'ACTIVE'
       ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(favorites.id)`,
      [userId, productId],
    );
    return result.insertId;
  },

  remove: async (userId, productId) => {
    const [result] = await db.promise().execute(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId],
    );
    return result.affectedRows;
  },
};

module.exports = FavoriteModel;
