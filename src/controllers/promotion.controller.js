const model = require('../models/promotion.model');

const list = async (req, res) => {
  try {
    return res.json({ data: await model.listActive() });
  } catch (error) {
    console.error('Promotion error:', error);
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Lỗi máy chủ' });
  }
};

module.exports = { list };

