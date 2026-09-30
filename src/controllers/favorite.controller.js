const service = require('../services/favorite.service');

const run = (action) => async (req, res) => {
  try {
    return res.json({ data: await action(req) });
  } catch (error) {
    console.error('Favorite error:', error);
    return res.status(error.statusCode || 500).json({
      code: error.statusCode ? 'FAVORITE_INVALID' : 'INTERNAL_ERROR',
      message: error.statusCode ? error.message : 'Lỗi máy chủ',
    });
  }
};

module.exports = {
  list: run((req) => service.list(req.user.id)),
  status: run((req) => service.status(req.user.id, req.params.productId)),
  add: run((req) => service.add(req.user.id, req.params.productId)),
  remove: run((req) => service.remove(req.user.id, req.params.productId)),
};

