const model = require('../models/catalog.model');

const parseMoney = (value, name) => {
  if (value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    const error = new Error(`${name} không hợp lệ`);
    error.statusCode = 400;
    throw error;
  }
  return number;
};

const list = async (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 60);
  const allowedSorts = ['newest', 'price_asc', 'price_desc', 'popular', 'rating'];
  const sort = allowedSorts.includes(query.sort) ? query.sort : 'newest';
  const filters = {
    query: typeof query.q === 'string' ? query.q.trim().slice(0, 100) : '',
    category: query.category ? String(query.category).trim() : '',
    brand: query.brand ? String(query.brand).trim() : '',
    minPrice: parseMoney(query.minPrice, 'minPrice'),
    maxPrice: parseMoney(query.maxPrice, 'maxPrice'),
    inStock: query.inStock === 'true' || query.inStock === true,
    sort,
    limit,
    offset: (page - 1) * limit,
  };
  if (
    filters.minPrice !== null &&
    filters.maxPrice !== null &&
    filters.minPrice > filters.maxPrice
  ) {
    const error = new Error('minPrice không được lớn hơn maxPrice');
    error.statusCode = 400;
    throw error;
  }
  const { rows, total } = await model.list(filters);
  return {
    items: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  };
};

module.exports = { list };

