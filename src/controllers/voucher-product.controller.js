const VoucherProductService = require('../services/voucher-product.service');

const VoucherProductController = {
  list: async (req, res) => {
    try {
      return res.json({ data: await VoucherProductService.list(Number(req.params.id)) });
    } catch (error) {
      console.error('List voucher products error:', error);
      return res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi máy chủ' });
    }
  },

  replace: async (req, res) => {
    try {
      const products = await VoucherProductService.replace(
        Number(req.params.id),
        req.body.productIds,
      );
      return res.json({ message: 'Cập nhật sản phẩm khuyến mại thành công', data: products });
    } catch (error) {
      console.error('Update voucher products error:', error);
      return res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi máy chủ' });
    }
  },
};

module.exports = VoucherProductController;
