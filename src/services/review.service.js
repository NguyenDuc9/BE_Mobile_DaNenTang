const model = require('../models/review.model');

const fail = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const idOf = (value, name) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) fail(`${name} không hợp lệ`, 400);
  return id;
};

const reviewInput = (body = {}) => {
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    fail('rating phải là số nguyên từ 1 đến 5', 400);
  }
  if (body.comment != null && typeof body.comment !== 'string') {
    fail('comment không hợp lệ', 400);
  }
  const comment = body.comment?.trim() || null;
  if (comment && comment.length > 2000) {
    fail('comment không được vượt quá 2000 ký tự', 400);
  }
  return { rating, comment };
};

const list = async (productIdValue, query) => {
  const productId = idOf(productIdValue, 'productId');
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
  // Lọc theo mức rating: 1..5, mặc định trả về tất cả.
  let ratingFilter = null;
  if (query.rating != null && query.rating !== '' && query.rating !== 'all') {
    const parsed = Number(query.rating);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 5) {
      ratingFilter = parsed;
    }
  }
  const result = await model.listApproved(
    productId, limit, (page - 1) * limit, ratingFilter,
  );
  return { ...result, page, limit, rating: ratingFilter };
};

const eligibility = (userId, productIdValue) =>
  model.eligibleOrderItems(userId, idOf(productIdValue, 'productId'));

const create = async (userId, productIdValue, body) => {
  const productId = idOf(productIdValue, 'productId');
  const orderItemId = idOf(body.orderItemId, 'orderItemId');
  const input = reviewInput(body);
  if (!(await model.findEligibleOrderItem(userId, productId, orderItemId))) {
    fail('Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng', 403);
  }
  try {
    const id = await model.create({ userId, productId, orderItemId, ...input });
    return { id, status: 'PENDING' };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      fail('Sản phẩm trong đơn hàng này đã được đánh giá', 409);
    }
    throw error;
  }
};

const update = async (userId, idValue, body) => {
  const id = idOf(idValue, 'reviewId');
  const input = reviewInput(body);
  if (!(await model.updateOwnPending(id, userId, input.rating, input.comment))) {
    fail('Chỉ có thể sửa đánh giá PENDING của chính bạn', 404);
  }
  return { id, status: 'PENDING' };
};

const remove = async (userId, idValue) => {
  const id = idOf(idValue, 'reviewId');
  if (!(await model.removeOwnPending(id, userId))) {
    fail('Chỉ có thể xóa đánh giá PENDING của chính bạn', 404);
  }
  return { id };
};

const moderate = async (idValue, status) => {
  const id = idOf(idValue, 'reviewId');
  if (!['APPROVED', 'HIDDEN'].includes(status)) {
    fail('status chỉ được là APPROVED hoặc HIDDEN', 400);
  }
  if (!(await model.setStatus(id, status))) fail('Review không tồn tại', 404);
  return { id, status };
};

module.exports = { list, eligibility, create, update, remove, moderate };

