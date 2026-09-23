const service = require('../services/order.service');

const handle = (action) => async (req, res) => {
  try {
    return res.json({ data: await action(req) });
  } catch (error) {
    console.error('Order error:', error);
    return res.status(error.statusCode || (error.code === 'ER_DUP_ENTRY' ? 409 : 500)).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

module.exports = {
  create: handle((req) => service.checkout(req.user.id, req.body)),
  list: handle((req) => service.list(req.user.id, req.user.role)),
  getOne: handle((req) => service.getById(req.user.id, req.params.id, undefined, req.user.role)),
  cancel: handle((req) => service.cancel(req.user.id, req.params.id, req.body.reason)),
  updateStatus: handle((req) => service.updateStatus(req.params.id, req.body.status, req.body.reason)),
};
