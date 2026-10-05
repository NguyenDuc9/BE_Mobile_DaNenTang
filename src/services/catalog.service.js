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

const parseList = (value) => {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values
    .map((entry) => String(entry).trim())
    .filter(Boolean)
    .slice(0, 30))];
};

const parseFilters = (query = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 60);
  const allowedSorts = ['newest', 'price_asc', 'price_desc', 'popular', 'rating'];
  const sort = allowedSorts.includes(query.sort) ? query.sort : 'newest';
  return {
    query: typeof query.q === 'string' ? query.q.trim().slice(0, 100) : '',
    category: query.category ? String(query.category).trim() : '',
    brand: parseList(query.brand),
    cpu: parseList(query.cpu),
    ram: parseList(query.ram),
    storage: parseList(query.storage),
    gpu: parseList(query.gpu),
    screenSize: parseList(query.screenSize),
    refreshRate: parseList(query.refreshRate),
    minPrice: parseMoney(query.minPrice ?? query.priceMin, 'minPrice'),
    maxPrice: parseMoney(query.maxPrice ?? query.priceMax, 'maxPrice'),
    inStock: query.inStock === 'true' || query.inStock === true,
    sort,
    limit,
    offset: (page - 1) * limit,
    page,
  };
};

const validateFilters = (filters) => {
  if (
    filters.minPrice !== null &&
    filters.maxPrice !== null &&
    filters.minPrice > filters.maxPrice
  ) {
    const error = new Error('minPrice không được lớn hơn maxPrice');
    error.statusCode = 400;
    throw error;
  }
};

const list = async (query = {}) => {
  const filters = parseFilters(query);
  validateFilters(filters);
  const { rows, total } = await model.list(filters);
  return {
    items: rows,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
      hasNextPage: filters.page * filters.limit < total,
    },
  };
};

const facets = async (query = {}) => {
  const filters = parseFilters(query);
  validateFilters(filters);
  return model.facets(filters);
};

module.exports = { list, facets };
