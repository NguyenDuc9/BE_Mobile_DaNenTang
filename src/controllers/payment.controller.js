const service = require('../services/payment.service');
const run = (action) => async (req, res) => {
  try { return res.json({ data: await action(req) }); }
  catch (error) {
    console.error('Payment error:', error);
    return res.status(error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 409 : 500)).json({ message: error.message || 'Lỗi máy chủ' });
  }
};
module.exports = {
  get: run((req) => service.get(req.user.id, req.params.orderId, req.user.role)),
  create: run((req) => service.create(req.user.id, req.params.orderId, req.body)),
  updateStatus: run((req) => service.updateStatus(req.user.id, req.params.id, req.body, req.user.role)),
};
