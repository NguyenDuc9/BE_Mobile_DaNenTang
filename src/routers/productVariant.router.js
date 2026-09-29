const express = require('express');
const router = express.Router();

const ProductVariantController = require('../controllers/productVariant.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

// Lấy tất cả variants
router.get('/', ProductVariantController.getAll);

// Lấy variants theo product
router.get('/product/:productId', ProductVariantController.getByProductId);

// Lấy variant theo id
router.get('/:id', ProductVariantController.getById);

// Tạo variant
router.post('/', authenticate, authorize('staff', 'admin'), ProductVariantController.create);

// Cập nhật variant
router.put('/:id', authenticate, authorize('staff', 'admin'), ProductVariantController.update);

// Xóa variant
router.delete('/:id', authenticate, authorize('staff', 'admin'), ProductVariantController.delete);

module.exports = router;
