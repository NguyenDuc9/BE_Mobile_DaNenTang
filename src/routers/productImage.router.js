const express = require('express');
const router = express.Router();

const ProductImageController = require('../controllers/productImage.controller');

// Lấy tất cả ảnh
router.get('/', ProductImageController.getAll);

// Lấy ảnh theo product_id
router.get('/product/:productId', ProductImageController.getByProductId);

// Lấy ảnh theo id
router.get('/:id', ProductImageController.getById);

// Thêm ảnh
router.post('/', ProductImageController.create);

// Cập nhật ảnh
router.put('/:id', ProductImageController.update);

// Xóa ảnh
router.delete('/:id', ProductImageController.delete);

module.exports = router;
