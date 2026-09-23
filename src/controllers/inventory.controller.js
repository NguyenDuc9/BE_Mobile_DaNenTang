const service = require('../services/inventory.service');
const run = (action) => async (req, res) => {
  try { return res.json({ data: await action(req) }); }
  catch (error) {
    console.error('Inventory error:', error);
    return res.status(error.statusCode || 500).json({ message: error.message || 'Lỗi máy chủ' });
  }
};
module.exports = {
  list: run(() => service.list()),
  change: run((req) => service.change(req.user.id, req.body)),
};
