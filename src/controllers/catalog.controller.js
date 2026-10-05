const service = require('../services/catalog.service');

const list = async (req, res) => {
  try {
    return res.json({ data: await service.list(req.query) });
  } catch (error) {
    console.error('Catalog error:', error);
    return res.status(error.statusCode || 500).json({
      code: error.statusCode ? 'CATALOG_INVALID' : 'INTERNAL_ERROR',
      message: error.statusCode ? error.message : 'Lỗi máy chủ',
    });
  }
};

const facets = async (req, res) => {
  try {
    return res.json({ data: await service.facets(req.query) });
  } catch (error) {
    console.error('Catalog facets error:', error);
    return res.status(error.statusCode || 500).json({
      code: error.statusCode ? 'CATALOG_INVALID' : 'INTERNAL_ERROR',
      message: error.statusCode ? error.message : 'Lỗi máy chủ',
    });
  }
};

module.exports = { list, facets };
