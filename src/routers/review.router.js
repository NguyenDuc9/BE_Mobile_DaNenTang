const express = require('express');
const router = express.Router();

const ReviewController = require('../controllers/review.controller');

// Lấy tất cả reviews
router.get('/', ReviewController.getAll);

// Lấy reviews theo product
router.get('/product/:productId', ReviewController.getByProductId);

// Lấy reviews theo user
router.get('/user/:userId', ReviewController.getByUserId);

// Lấy reviews theo order item
router.get('/order-item/:orderItemId', ReviewController.getByOrderItemId);

// Lấy review theo id
router.get('/:id', ReviewController.getById);

// Tạo review
router.post('/', ReviewController.create);

// Cập nhật review
router.put('/:id', ReviewController.update);

// Xóa review
router.delete('/:id', ReviewController.delete);

module.exports = router;
