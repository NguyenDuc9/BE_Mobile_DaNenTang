const express = require('express');
const router = express.Router();

const ProductImageController = require('../controllers/productImage.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

// Lấy tất cả ảnh
router.get('/', ProductImageController.getAll);

// Lấy ảnh theo product_id
router.get('/product/:productId', ProductImageController.getByProductId);

// Lấy ảnh theo id
router.get('/:id', ProductImageController.getById);

// Thêm ảnh
router.post('/', authenticate, authorize('staff', 'admin'), ProductImageController.create);

// Cập nhật ảnh
router.put('/:id', authenticate, authorize('staff', 'admin'), ProductImageController.update);

// Xóa ảnh
router.delete('/:id', authenticate, authorize('staff', 'admin'), ProductImageController.delete);

module.exports = router;
