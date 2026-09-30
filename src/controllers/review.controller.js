const service = require('../services/review.service');

const run = (action) => async (req, res) => {
  try {
    return res.json({ data: await action(req) });
  } catch (error) {
    console.error('Review error:', error);
    return res.status(error.statusCode || 500).json({
      code: error.statusCode ? 'REVIEW_INVALID' : 'INTERNAL_ERROR',
      message: error.statusCode ? error.message : 'Lỗi máy chủ',
    });
  }
};

module.exports = {
  list: run((req) => service.list(req.params.id, req.query)),
  eligibility: run((req) => service.eligibility(req.user.id, req.params.id)),
  create: run((req) => service.create(req.user.id, req.params.id, req.body)),
  update: run((req) => service.update(req.user.id, req.params.id, req.body)),
  remove: run((req) => service.remove(req.user.id, req.params.id)),
  moderate: run((req) => service.moderate(req.params.id, req.body.status)),
};

