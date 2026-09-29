const express = require('express');
const router = express.Router();

const BrandController = require('../controllers/brand.controller');

// GET tất cả brand
router.get('/', BrandController.getAll);

// GET brand theo id
router.get('/:id', BrandController.getById);

// POST tạo brand
router.post('/', BrandController.create);

// PUT cập nhật brand
router.put('/:id', BrandController.update);

// DELETE brand
router.delete('/:id', BrandController.delete);

module.exports = router;
