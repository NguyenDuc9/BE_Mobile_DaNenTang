const service = require('../services/laptop-upgrade.service');

const run = (action) => async (req, res) => {
  try { return res.json({ data: await action(req) }); }
  catch (error) {
    console.error('Laptop upgrade error:', error);
    return res.status(error.statusCode || 500).json({
      code: error.statusCode ? 'LAPTOP_UPGRADE_INVALID' : 'INTERNAL_ERROR',
      message: error.statusCode ? error.message : 'Lỗi máy chủ',
    });
  }
};

module.exports = {
  options: run((req) => service.options(req.params.id)),
  validate: run((req) => service.validate(req.params.id, req.body)),
};

