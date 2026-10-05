const express = require('express');
const db = require('../common/common');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

const router = express.Router();
router.use(authenticate, authorize('admin', 'staff'));

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const positiveId = (value, name) => {
  if (!/^\d+$/.test(String(value ?? '').trim())) fail(`${name} không hợp lệ`);
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) fail(`${name} không hợp lệ`);
  return id;
};

const pageOptions = (query) => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 15);
  if (!Number.isSafeInteger(page) || page < 1) fail('page không hợp lệ');
  if (!Number.isSafeInteger(limit) || limit < 1) fail('limit không hợp lệ');
  const safeLimit = Math.min(limit, 100);
  return { page, limit: safeLimit, offset: (page - 1) * safeLimit };
};

const pagedResponse = async (req, res, selectSql, countSql, params = []) => {
  const pagination = pageOptions(req.query);
  const [[rows], [countRows]] = await Promise.all([
    db.execute(selectSql, [...params, pagination.limit, pagination.offset]),
    db.execute(countSql, params),
  ]);
  const total = Number(countRows[0].total);
  return res.json({
    data: rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    },
  });
};

const handle = (action) => async (req, res) => {
  try {
    return await action(req, res);
  } catch (error) {
    console.error('Admin FE API error:', error);
    const statusCode =
      error.statusCode ||
      (error.code === 'ER_DUP_ENTRY'
        ? 409
        : error.code === 'ER_NO_REFERENCED_ROW_2'
          ? 400
          : 500);
    const message =
      error.statusCode
        ? error.message
        : error.code === 'ER_DUP_ENTRY'
          ? 'Dữ liệu đã tồn tại.'
          : error.code === 'ER_NO_REFERENCED_ROW_2'
            ? 'Người dùng hoặc sản phẩm không tồn tại.'
            : 'Lỗi máy chủ';
    return res.status(statusCode).json({ message });
  }
};

const listFavorites = (req, res) =>
  pagedResponse(
    req,
    res,
    `SELECT f.id, f.user_id, f.product_id, f.created_at
     FROM favorites f ORDER BY f.created_at DESC, f.id DESC LIMIT ? OFFSET ?`,
    'SELECT COUNT(*) AS total FROM favorites',
  );

const createFavorite = async (req, res) => {
  const body = req.body || {};
  const userId = positiveId(body.user_id, 'user_id');
  const productId = positiveId(body.product_id, 'product_id');
  const [result] = await db.execute(
    'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId],
  );
  return res.status(201).json({
    data: { id: result.insertId, user_id: userId, product_id: productId },
  });
};

const deleteFavorite = async (req, res) => {
  const id = positiveId(req.params.id, 'id');
  const [result] = await db.execute('DELETE FROM favorites WHERE id = ?', [id]);
  if (!result.affectedRows) fail('Không tìm thấy sản phẩm yêu thích', 404);
  return res.status(204).end();
};

const listReviews = (req, res) =>
  pagedResponse(
    req,
    res,
    `SELECT id, user_id, product_id, rating, comment, status, created_at, updated_at
     FROM reviews ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    'SELECT COUNT(*) AS total FROM reviews',
  );

const validateReview = (body) => {
  body = body || {};
  const userId = positiveId(body.user_id, 'user_id');
  const productId = positiveId(body.product_id, 'product_id');
  const rating = Number(body.rating);
  const status = body.status || 'PENDING';
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fail('rating phải là số nguyên từ 1 đến 5');
  }
  if (body.comment != null && typeof body.comment !== 'string') {
    fail('comment không hợp lệ');
  }
  if (body.comment && body.comment.length > 2000) {
    fail('comment không được vượt quá 2000 ký tự');
  }
  if (!['PENDING', 'APPROVED', 'HIDDEN'].includes(status)) {
    fail('status không hợp lệ');
  }
  return {
    userId,
    productId,
    rating,
    comment: body.comment?.trim() || null,
    status,
  };
};

const createReview = async (req, res) => {
  const review = validateReview(req.body);
  const [result] = await db.execute(
    `INSERT INTO reviews (user_id, product_id, rating, comment, status)
     VALUES (?, ?, ?, ?, ?)`,
    [review.userId, review.productId, review.rating, review.comment, review.status],
  );
  return res.status(201).json({ data: { id: result.insertId, ...review } });
};

const updateReview = async (req, res) => {
  const id = positiveId(req.params.id, 'id');
  const review = validateReview(req.body);
  const [result] = await db.execute(
    `UPDATE reviews
     SET user_id = ?, product_id = ?, rating = ?, comment = ?, status = ?
     WHERE id = ?`,
    [review.userId, review.productId, review.rating, review.comment, review.status, id],
  );
  if (!result.affectedRows) {
    const [rows] = await db.execute('SELECT id FROM reviews WHERE id = ?', [id]);
    if (!rows[0]) fail('Không tìm thấy đánh giá', 404);
  }
  return res.json({ data: { id, ...review } });
};

const deleteReview = async (req, res) => {
  const id = positiveId(req.params.id, 'id');
  const [result] = await db.execute('DELETE FROM reviews WHERE id = ?', [id]);
  if (!result.affectedRows) fail('Không tìm thấy đánh giá', 404);
  return res.status(204).end();
};

const voucherProducts = async (req, res) => {
  const voucherId = positiveId(req.params.id, 'voucherId');
  const [vouchers] = await db.execute(
    'SELECT id FROM vouchers WHERE id = ?',
    [voucherId],
  );
  if (!vouchers[0]) fail('Không tìm thấy voucher', 404);
  return pagedResponse(
    req,
    res,
    `SELECT p.id, p.name, p.slug, p.thumbnail_url
     FROM voucher_products vp
     JOIN products p ON p.id = vp.product_id
     WHERE vp.voucher_id = ?
     ORDER BY p.name, p.id LIMIT ? OFFSET ?`,
    'SELECT COUNT(*) AS total FROM voucher_products WHERE voucher_id = ?',
    [voucherId],
  );
};

const setVoucherProducts = async (req, res) => {
  const voucherId = positiveId(req.params.id, 'voucherId');
  const productIdsInput = req.body?.productIds;
  if (!Array.isArray(productIdsInput)) fail('productIds phải là một danh sách');
  const productIds = [
    ...new Set(
      productIdsInput.map((value) => positiveId(value, 'productId')),
    ),
  ];

  const products = await db.withTransaction(async (connection) => {
    const [vouchers] = await connection.execute(
      'SELECT id FROM vouchers WHERE id = ? FOR UPDATE',
      [voucherId],
    );
    if (!vouchers[0]) fail('Không tìm thấy voucher', 404);

    if (productIds.length) {
      const placeholders = productIds.map(() => '?').join(', ');
      const [found] = await connection.execute(
        `SELECT id FROM products WHERE id IN (${placeholders})`,
        productIds,
      );
      if (found.length !== productIds.length) {
        fail('Một hoặc nhiều sản phẩm không tồn tại', 404);
      }
    }

    await connection.execute('DELETE FROM voucher_products WHERE voucher_id = ?', [voucherId]);
    for (const productId of productIds) {
      await connection.execute(
        'INSERT INTO voucher_products (voucher_id, product_id) VALUES (?, ?)',
        [voucherId, productId],
      );
    }
    if (!productIds.length) return [];
    const placeholders = productIds.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT id, name, slug, thumbnail_url FROM products
       WHERE id IN (${placeholders}) ORDER BY name, id`,
      productIds,
    );
    return rows;
  });
  return res.json({ data: products });
};

router.get('/favorites', handle(listFavorites));
router.post('/favorites', handle(createFavorite));
router.delete('/favorites/:id', handle(deleteFavorite));
router.get('/reviews', handle(listReviews));
router.post('/reviews', handle(createReview));
router.put('/reviews/:id', handle(updateReview));
router.delete('/reviews/:id', handle(deleteReview));
router.get('/vouchers/:id/products', handle(voucherProducts));
router.put('/vouchers/:id/products', handle(setVoucherProducts));

module.exports = router;
