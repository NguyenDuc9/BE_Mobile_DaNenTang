const ReviewService = require('../services/review.service');

const ReviewController = {
  // GET /api/reviews
  getAll: async (req, res) => {
    try {
      const reviews = await ReviewService.getAllReviews();

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/reviews/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await ReviewService.getReviewById(id);

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/reviews/product/:productId
  getByProductId: async (req, res) => {
    try {
      const { productId } = req.params;

      const reviews = await ReviewService.getReviewsByProductId(productId);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/reviews/user/:userId
  getByUserId: async (req, res) => {
    try {
      const { userId } = req.params;

      const reviews = await ReviewService.getReviewsByUserId(userId);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/reviews/order-item/:orderItemId
  getByOrderItemId: async (req, res) => {
    try {
      const { orderItemId } = req.params;

      const reviews = await ReviewService.getReviewsByOrderItemId(orderItemId);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/reviews
  create: async (req, res) => {
    try {
      const review = await ReviewService.createReview(req.body);

      res.status(201).json({
        success: true,
        message: 'Tạo review thành công',
        data: review,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/reviews/:id
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await ReviewService.updateReview(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Cập nhật review thành công',
        data: review,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/reviews/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      await ReviewService.deleteReview(id);

      res.status(200).json({
        success: true,
        message: 'Xóa review thành công',
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = ReviewController;
