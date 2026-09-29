const ReviewModel = require('../models/review.model');
const db = require('../common/common');

const ReviewService = {
  // ==========================================
  // Lấy tất cả reviews
  // ==========================================

  getAllReviews: async () => {
    return await ReviewModel.getAll();
  },

  // ==========================================
  // Lấy review theo ID
  // ==========================================

  getReviewById: async (id) => {
    const review = await ReviewModel.getById(id);

    if (!review) {
      throw new Error('Review không tồn tại');
    }

    return review;
  },

  // ==========================================
  // Lấy reviews theo product
  // ==========================================

  getReviewsByProductId: async (productId) => {
    const [products] = await db.execute(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [productId],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    return await ReviewModel.getByProductId(productId);
  },

  // ==========================================
  // Lấy reviews theo user
  // ==========================================

  getReviewsByUserId: async (userId) => {
    const [users] = await db.execute(
      `SELECT id
       FROM users
       WHERE id = ?`,
      [userId],
    );

    if (users.length === 0) {
      throw new Error('User không tồn tại');
    }

    return await ReviewModel.getByUserId(userId);
  },

  // ==========================================
  // Lấy review theo order item
  // ==========================================

  getReviewsByOrderItemId: async (orderItemId) => {
    const [orderItems] = await db.execute(
      `SELECT id
       FROM order_items
       WHERE id = ?`,
      [orderItemId],
    );

    if (orderItems.length === 0) {
      throw new Error('Order item không tồn tại');
    }

    return await ReviewModel.getByOrderItemId(orderItemId);
  },

  // ==========================================
  // Tạo review
  // ==========================================

  createReview: async (data) => {
    const { user_id, product_id, order_item_id, rating, comment, status } =
      data;

    // ------------------------------------------
    // Validate bắt buộc
    // ------------------------------------------

    if (!user_id) {
      throw new Error('user_id là bắt buộc');
    }

    if (!product_id) {
      throw new Error('product_id là bắt buộc');
    }

    if (rating === undefined || rating === null) {
      throw new Error('rating là bắt buộc');
    }

    // ------------------------------------------
    // Validate rating
    // ------------------------------------------

    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      throw new Error('Rating phải là số nguyên từ 1 đến 5');
    }

    // ------------------------------------------
    // Validate status
    // ------------------------------------------

    if (status && !['PENDING', 'APPROVED', 'HIDDEN'].includes(status)) {
      throw new Error('Status phải là PENDING, APPROVED hoặc HIDDEN');
    }

    // ------------------------------------------
    // Kiểm tra user
    // ------------------------------------------

    const [users] = await db.execute(
      `SELECT id
       FROM users
       WHERE id = ?`,
      [user_id],
    );

    if (users.length === 0) {
      throw new Error('User không tồn tại');
    }

    // ------------------------------------------
    // Kiểm tra product
    // ------------------------------------------

    const [products] = await db.execute(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    // ------------------------------------------
    // Kiểm tra order_item nếu có
    // ------------------------------------------

    if (order_item_id) {
      const [orderItems] = await db.execute(
        `SELECT id
         FROM order_items
         WHERE id = ?`,
        [order_item_id],
      );

      if (orderItems.length === 0) {
        throw new Error('Order item không tồn tại');
      }
    }

    // ------------------------------------------
    // Tạo review
    // ------------------------------------------

    const id = await ReviewModel.create(data);

    return await ReviewModel.getById(id);
  },

  // ==========================================
  // Cập nhật review
  // ==========================================

  updateReview: async (id, data) => {
    const review = await ReviewModel.getById(id);

    if (!review) {
      throw new Error('Review không tồn tại');
    }

    const { product_id, order_item_id, rating, comment, status } = data;

    // ------------------------------------------
    // Validate
    // ------------------------------------------

    if (!product_id) {
      throw new Error('product_id là bắt buộc');
    }

    if (rating === undefined || rating === null) {
      throw new Error('rating là bắt buộc');
    }

    if (
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      throw new Error('Rating phải là số nguyên từ 1 đến 5');
    }

    if (status && !['PENDING', 'APPROVED', 'HIDDEN'].includes(status)) {
      throw new Error('Status phải là PENDING, APPROVED hoặc HIDDEN');
    }

    // ------------------------------------------
    // Kiểm tra product
    // ------------------------------------------

    const [products] = await db.execute(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    // ------------------------------------------
    // Kiểm tra order item nếu có
    // ------------------------------------------

    if (order_item_id) {
      const [orderItems] = await db.execute(
        `SELECT id
         FROM order_items
         WHERE id = ?`,
        [order_item_id],
      );

      if (orderItems.length === 0) {
        throw new Error('Order item không tồn tại');
      }
    }

    // ------------------------------------------
    // Update
    // ------------------------------------------

    await ReviewModel.update(id, data);

    return await ReviewModel.getById(id);
  },

  // ==========================================
  // Xóa review
  // ==========================================

  deleteReview: async (id) => {
    const review = await ReviewModel.getById(id);

    if (!review) {
      throw new Error('Review không tồn tại');
    }

    await ReviewModel.delete(id);

    return true;
  },
};

module.exports = ReviewService;
