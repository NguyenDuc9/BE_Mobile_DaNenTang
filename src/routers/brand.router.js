const express = require('express');
const router = express.Router();

const BrandController = require('../controllers/brand.controller');
const { authenticate, authorize } = require('../middlewares/authorization.middleware');

// GET tất cả brand
router.get('/', BrandController.getAll);

// GET brand theo id
router.get('/:id', BrandController.getById);

// POST tạo brand
router.post('/', authenticate, authorize('staff', 'admin'), BrandController.create);

// PUT cập nhật brand
router.put('/:id', authenticate, authorize('staff', 'admin'), BrandController.update);

// DELETE brand
router.delete('/:id', authenticate, authorize('staff', 'admin'), BrandController.delete);

module.exports = router;
