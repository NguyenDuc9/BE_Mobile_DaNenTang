const db = require('../common/common');

const productFrom = `
  FROM products p
  JOIN categories c ON c.id = p.category_id AND c.status = 'ACTIVE'
  JOIN brands b ON b.id = p.brand_id AND b.status = 'ACTIVE'
  JOIN product_variants pv ON pv.id = (
    SELECT candidate.id FROM product_variants candidate
    WHERE candidate.product_id = p.id AND candidate.status = 'ACTIVE'
    ORDER BY (candidate.stock_quantity > 0) DESC, candidate.price ASC, candidate.id ASC
    LIMIT 1
  )
  LEFT JOIN (
    SELECT product_id, COUNT(*) AS review_count, AVG(rating) AS rating_average
    FROM reviews WHERE status = 'APPROVED' GROUP BY product_id
  ) review_stats ON review_stats.product_id = p.id
  LEFT JOIN (
    SELECT variants.product_id, SUM(items.quantity) AS sold_quantity
    FROM order_items items
    JOIN orders completed_orders ON completed_orders.id = items.order_id
      AND completed_orders.status IN ('DELIVERED', 'COMPLETED')
    JOIN product_variants variants ON variants.id = items.product_variant_id
    GROUP BY variants.product_id
  ) sales ON sales.product_id = p.id
`;

const buildFilters = (filters) => {
  const clauses = ["p.status = 'ACTIVE'"];
  const params = [];
  const addInFilter = (column, values) => {
    if (!values || values.length === 0) return;
    clauses.push(`${column} IN (${values.map(() => '?').join(', ')})`);
    params.push(...values);
  };
  if (filters.query) {
    clauses.push('(p.name LIKE ? OR b.name LIKE ? OR c.name LIKE ? OR pv.sku LIKE ?)');
    const search = `%${filters.query}%`;
    params.push(search, search, search, search);
  }
  if (filters.category) {
    clauses.push('(c.slug = ? OR c.id = ?)');
    params.push(filters.category, Number(filters.category) || 0);
  }
  if (filters.brand && filters.brand.length > 0) {
    const values = filters.brand;
    const numericIds = values.filter((value) => /^\d+$/.test(value));
    const namesOrSlugs = values.filter((value) => !/^\d+$/.test(value));
    const conditions = [];
    if (namesOrSlugs.length) {
      conditions.push(
        `(b.name IN (${namesOrSlugs.map(() => '?').join(', ')}) OR b.slug IN (${namesOrSlugs.map(() => '?').join(', ')}))`,
      );
      params.push(...namesOrSlugs, ...namesOrSlugs);
    }
    if (numericIds.length) {
      conditions.push(`b.id IN (${numericIds.map(() => '?').join(', ')})`);
      params.push(...numericIds.map(Number));
    }
    clauses.push(`(${conditions.join(' OR ')})`);
  }
  if (filters.minPrice !== null) {
    clauses.push('pv.price >= ?');
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== null) {
    clauses.push('pv.price <= ?');
    params.push(filters.maxPrice);
  }
  addInFilter('pv.cpu', filters.cpu);
  addInFilter('pv.ram', filters.ram);
  addInFilter('pv.storage', filters.storage);
  addInFilter('pv.gpu', filters.gpu);
  addInFilter('pv.screen_size', filters.screenSize);
  addInFilter('pv.refresh_rate', filters.refreshRate);
  if (filters.inStock) clauses.push('pv.stock_quantity > 0');
  return { where: `WHERE ${clauses.join(' AND ')}`, params };
};

const sortSql = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'pv.price ASC, p.id DESC',
  price_desc: 'pv.price DESC, p.id DESC',
  popular: 'COALESCE(sales.sold_quantity, 0) DESC, p.created_at DESC',
  rating: 'COALESCE(review_stats.rating_average, 0) DESC, COALESCE(review_stats.review_count, 0) DESC',
};

const CatalogModel = {
  list: async (filters) => {
    const { where, params } = buildFilters(filters);
    const [countRows] = await db.promise().execute(
      `SELECT COUNT(*) AS total ${productFrom} ${where}`,
      params,
    );
    const [rows] = await db.promise().execute(
      `SELECT p.id, p.category_id, c.name AS category_name, c.slug AS category_slug,
              p.brand_id, b.name AS brand_name, b.slug AS brand_slug,
              p.name, p.slug, p.description, p.thumbnail_url, p.status,
              p.created_at, p.updated_at,
              pv.id AS variant_id, pv.sku, pv.variant_name, pv.price,
              pv.compare_at_price, pv.stock_quantity, pv.cpu, pv.ram,
              pv.storage, pv.gpu, pv.screen_size, pv.screen_resolution,
              pv.refresh_rate, pv.operating_system, pv.color, pv.weight_kg,
              pv.warranty_months, pv.status AS variant_status,
              COALESCE(review_stats.review_count, 0) AS review_count,
              COALESCE(review_stats.rating_average, 0) AS rating_average,
              COALESCE(sales.sold_quantity, 0) AS sold_quantity
       ${productFrom}
       ${where}
       ORDER BY ${sortSql[filters.sort] || sortSql.newest}
       LIMIT ? OFFSET ?`,
      [...params, filters.limit, filters.offset],
    );
    return { rows, total: Number(countRows[0].total) };
  },
  facets: async (filters) => {
    const baseFilters = {
      ...filters,
      brand: [],
      cpu: [],
      ram: [],
      storage: [],
      gpu: [],
      screenSize: [],
      refreshRate: [],
      minPrice: null,
      maxPrice: null,
      inStock: true,
    };
    const { where, params } = buildFilters(baseFilters);
    const definitions = {
      brand: { column: 'b.name', label: 'Thương hiệu' },
      cpu: { column: 'pv.cpu', label: 'CPU' },
      ram: { column: 'pv.ram', label: 'RAM' },
      storage: { column: 'pv.storage', label: 'Ổ cứng / SSD' },
      gpu: { column: 'pv.gpu', label: 'Card đồ họa (GPU)' },
      screenSize: { column: 'pv.screen_size', label: 'Kích thước màn hình' },
      refreshRate: { column: 'pv.refresh_rate', label: 'Tần số quét' },
    };
    const entries = await Promise.all(
      Object.entries(definitions).map(async ([key, definition]) => {
        const [rows] = await db.promise().execute(
          `SELECT ${definition.column} AS value, COUNT(DISTINCT p.id) AS count
           ${productFrom}
           ${where} AND ${definition.column} IS NOT NULL
             AND TRIM(${definition.column}) <> ''
           GROUP BY ${definition.column}
           ORDER BY ${definition.column}`,
          params,
        );
        return [
          key,
          {
            key,
            label: definition.label,
            entries: rows.map((row) => ({
              value: String(row.value),
              count: Number(row.count),
            })),
          },
        ];
      }),
    );
    const [priceRows] = await db.promise().execute(
      `SELECT MIN(pv.price) AS min, MAX(pv.price) AS max
       ${productFrom}
       ${where}`,
      params,
    );
    return {
      ...Object.fromEntries(entries),
      priceRange: {
        min: Number(priceRows[0]?.min || 0),
        max: Number(priceRows[0]?.max || 0),
      },
    };
  },
};

module.exports = CatalogModel;
