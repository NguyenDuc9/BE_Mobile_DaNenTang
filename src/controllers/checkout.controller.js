const service = require('../services/order.service');

const run = (action) => async (req, res) => {
  try {
    return res.json({ data: await action(req) });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(error.statusCode || 500).json({
      code: error.statusCode ? 'CHECKOUT_INVALID' : 'INTERNAL_ERROR',
      message: error.statusCode ? error.message : 'Lỗi máy chủ',
    });
  }
};

module.exports = {
  options: run(() => service.options()),
  quote: run((req) => service.quote(req.user.id, req.body)),
};

