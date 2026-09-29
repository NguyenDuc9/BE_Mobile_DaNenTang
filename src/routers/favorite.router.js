const express = require('express');
const router = express.Router();

const FavoriteController = require('../controllers/favorite.controller');

// Lấy tất cả favorites
router.get('/', FavoriteController.getAll);

// Lấy favorites của user
router.get('/user/:userId', FavoriteController.getByUserId);

// Kiểm tra user đã favorite product chưa
router.get('/check/:userId/:productId', FavoriteController.checkFavorite);

// Xóa favorite theo user + product
router.delete(
  '/user/:userId/product/:productId',
  FavoriteController.removeFavorite,
);

// Lấy favorite theo id
router.get('/:id', FavoriteController.getById);

// Thêm favorite
router.post('/', FavoriteController.create);

// Xóa favorite theo id
router.delete('/:id', FavoriteController.delete);

module.exports = router;
