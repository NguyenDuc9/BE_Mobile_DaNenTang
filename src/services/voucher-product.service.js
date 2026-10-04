const db = require('../common/common');
const VoucherModel = require('../models/voucher.model');
const VoucherProductModel = require('../models/voucher-product.model');

const VoucherProductService = {
  list: async (voucherId) => {
    const voucher = await VoucherModel.findById(voucherId);
    if (!voucher) {
      throw Object.assign(new Error('Không tìm thấy khuyến mại'), { statusCode: 404 });
    }
    return VoucherProductModel.listByVoucher(voucherId);
  },

  replace: async (voucherId, inputIds) => {
    const voucher = await VoucherModel.findById(voucherId);
    if (!voucher) {
      throw Object.assign(new Error('Không tìm thấy khuyến mại'), { statusCode: 404 });
    }
    if (!Array.isArray(inputIds)) {
      throw Object.assign(new Error('productIds phải là một danh sách'), { statusCode: 400 });
    }

    const productIds = [...new Set(inputIds.map(Number))];
    if (productIds.some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      throw Object.assign(new Error('Danh sách productIds không hợp lệ'), { statusCode: 400 });
    }

    if (productIds.length) {
      const placeholders = productIds.map(() => '?').join(', ');
      const [rows] = await db.promise().execute(
        `SELECT id FROM products WHERE id IN (${placeholders})`,
        productIds,
      );
      if (rows.length !== productIds.length) {
        throw Object.assign(new Error('Một hoặc nhiều sản phẩm không tồn tại'), { statusCode: 400 });
      }
    }

    await VoucherProductModel.replaceProducts(voucherId, productIds);
    return VoucherProductModel.listByVoucher(voucherId);
  },
};

module.exports = VoucherProductService;
