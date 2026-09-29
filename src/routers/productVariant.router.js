const express = require('express');
const router = express.Router();

const ProductVariantController = require('../controllers/productVariant.controller');

// Lấy tất cả variants
router.get('/', ProductVariantController.getAll);

// Lấy variants theo product
router.get('/product/:productId', ProductVariantController.getByProductId);

// Lấy variant theo id
router.get('/:id', ProductVariantController.getById);

// Tạo variant
router.post('/', ProductVariantController.create);

// Cập nhật variant
router.put('/:id', ProductVariantController.update);

// Xóa variant
router.delete('/:id', ProductVariantController.delete);

module.exports = router;
