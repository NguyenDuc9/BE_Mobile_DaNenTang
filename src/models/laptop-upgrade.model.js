const db = require('../common/common');

const getProfile = async (productId) => {
  const [rows] = await db.promise().execute(
    `SELECT lup.*, p.name AS product_name
     FROM laptop_upgrade_profiles lup
     JOIN products p ON p.id = lup.product_id AND p.status = 'ACTIVE'
     WHERE lup.product_id = ? LIMIT 1`,
    [productId],
  );
  return rows[0];
};

const getOptions = async (productId) => {
  const [rows] = await db.promise().execute(
    `SELECT * FROM laptop_upgrade_options
     WHERE laptop_product_id = ? AND status = 'ACTIVE'
     ORDER BY type, capacity_gb`,
    [productId],
  );
  return rows;
};

const getVariantProduct = async (variantId) => {
  const [rows] = await db.promise().execute(
    `SELECT pv.id, pv.product_id, pv.price, pv.ram, pv.storage
     FROM product_variants pv JOIN products p ON p.id = pv.product_id
     WHERE pv.id = ? AND pv.status = 'ACTIVE' AND p.status = 'ACTIVE' LIMIT 1`,
    [variantId],
  );
  return rows[0];
};

module.exports = { getProfile, getOptions, getVariantProduct };

