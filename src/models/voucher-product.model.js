const db = require('../common/common');

const VoucherProductModel = {
  listByVoucher: async (voucherId) => {
    const [rows] = await db.promise().execute(
      `SELECT p.id, p.name, p.slug, p.thumbnail_url
       FROM voucher_products vp
       JOIN products p ON p.id = vp.product_id
       WHERE vp.voucher_id = ?
       ORDER BY p.name ASC`,
      [voucherId],
    );
    return rows;
  },

  replaceProducts: async (voucherId, productIds) =>
    db.withTransaction(async (connection) => {
      await connection.execute('DELETE FROM voucher_products WHERE voucher_id = ?', [voucherId]);
      if (productIds.length) {
        const values = productIds.map(() => '(?, ?)').join(', ');
        const parameters = productIds.flatMap((productId) => [voucherId, productId]);
        await connection.execute(
          `INSERT INTO voucher_products (voucher_id, product_id) VALUES ${values}`,
          parameters,
        );
      }
    }),
};

module.exports = VoucherProductModel;
