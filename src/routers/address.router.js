const express = require('express');

const router = express.Router();

const AddressController = require('../controllers/address.controller');

// Nếu project có auth middleware:
// const authMiddleware = require('../middlewares/auth.middleware');
// router.use(authMiddleware);

// Lấy tất cả địa chỉ của user
router.get('/', AddressController.getAll);

// Lấy chi tiết địa chỉ
router.get('/:id', AddressController.getById);

// Thêm địa chỉ
router.post('/', AddressController.create);

// Cập nhật địa chỉ
router.put('/:id', AddressController.update);

// Xóa địa chỉ
router.delete('/:id', AddressController.delete);

// Đặt địa chỉ mặc định
router.patch('/:id/default', AddressController.setDefault);

module.exports = router;
