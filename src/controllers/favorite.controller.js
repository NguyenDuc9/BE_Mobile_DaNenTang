const FavoriteService = require('../services/favorite.service');

const FavoriteController = {
  // GET /api/favorites
  getAll: async (req, res) => {
    try {
      const favorites = await FavoriteService.getAllFavorites();

      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/favorites/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const favorite = await FavoriteService.getFavoriteById(id);

      res.status(200).json({
        success: true,
        data: favorite,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/favorites/user/:userId
  getByUserId: async (req, res) => {
    try {
      const { userId } = req.params;

      const favorites = await FavoriteService.getFavoritesByUserId(userId);

      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/favorites/check/:userId/:productId
  checkFavorite: async (req, res) => {
    try {
      const { userId, productId } = req.params;

      const result = await FavoriteService.checkFavorite(userId, productId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/favorites
  create: async (req, res) => {
    try {
      const favorite = await FavoriteService.createFavorite(req.body);

      res.status(201).json({
        success: true,
        message: 'Thêm sản phẩm vào yêu thích thành công',
        data: favorite,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/favorites/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      await FavoriteService.deleteFavorite(id);

      res.status(200).json({
        success: true,
        message: 'Xóa favorite thành công',
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/favorites/user/:userId/product/:productId
  removeFavorite: async (req, res) => {
    try {
      const { userId, productId } = req.params;

      await FavoriteService.removeFavorite(userId, productId);

      res.status(200).json({
        success: true,
        message: 'Xóa sản phẩm khỏi yêu thích thành công',
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = FavoriteController;
