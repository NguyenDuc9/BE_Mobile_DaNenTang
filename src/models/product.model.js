const db = require('../common/common');

const selectProduct = `
  SELECT p.id, p.category_id, c.name AS category_name,
         p.brand_id, b.name AS brand_name, p.name, p.slug,
         p.description, p.thumbnail_url, p.status,
         p.created_at, p.updated_at
  FROM products p
  JOIN categories c ON p.category_id = c.id
  JOIN brands b ON p.brand_id = b.id
`;

const ProductModel = {
  findAll: async () => {
    const [rows] = await db.promise().execute(`
      ${selectProduct}
      ORDER BY p.created_at DESC
    `);

    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.promise().execute(
      `
        ${selectProduct}
        WHERE p.id = ?
        LIMIT 1
      `,
      [id],
    );

    return rows[0];
  },

  create: async ({
    categoryId,
    brandId,
    name,
    slug,
    description,
    thumbnailUrl,
    status,
  }) => {
    const [result] = await db.promise().execute(
      `
        INSERT INTO products
          (category_id, brand_id, name, slug, description, thumbnail_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        categoryId,
        brandId,
        name,
        slug,
        description || null,
        thumbnailUrl || null,
        status || 'DRAFT',
      ],
    );

    return result.insertId;
  },

  update: async (
    id,
    { categoryId, brandId, name, slug, description, thumbnailUrl, status },
  ) => {
    const [result] = await db.promise().execute(
      `
        UPDATE products
        SET category_id = ?, brand_id = ?, name = ?, slug = ?,
            description = ?, thumbnail_url = ?, status = ?
        WHERE id = ?
      `,
      [
        categoryId,
        brandId,
        name,
        slug,
        description || null,
        thumbnailUrl || null,
        status,
        id,
      ],
    );

    return result.affectedRows;
  },

  remove: async (id) => {
    const [result] = await db
      .promise()
      .execute('DELETE FROM products WHERE id = ?', [id]);

    return result.affectedRows;
  },
};

module.exports = ProductModel;
