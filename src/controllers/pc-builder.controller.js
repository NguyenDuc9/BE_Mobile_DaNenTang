const service = require('../services/pc-builder.service');

const run = (action) => async (req, res) => {
  try {
    return res.json({ data: await action(req) });
  } catch (error) {
    console.error('PC Builder error:', error);
    return res.status(error.statusCode || 500).json({
      code: error.statusCode ? 'PC_BUILD_INVALID' : 'INTERNAL_ERROR',
      message: error.statusCode ? error.message : 'Lỗi máy chủ',
    });
  }
};

module.exports = {
  options: run(() => service.options()),
  validate: run((req) => service.validate(req.body)),
};

