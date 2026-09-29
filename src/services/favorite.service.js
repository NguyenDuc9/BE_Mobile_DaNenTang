const FavoriteModel = require('../models/favorite.model');
const db = require('../common/common');

const FavoriteService = {
  // Lấy tất cả
  getAllFavorites: async () => {
    return await FavoriteModel.getAll();
  },

  // Lấy theo ID
  getFavoriteById: async (id) => {
    const favorite = await FavoriteModel.getById(id);

    if (!favorite) {
      throw new Error('Favorite không tồn tại');
    }

    return favorite;
  },

  // Lấy danh sách favorite của user
  getFavoritesByUserId: async (userId) => {
    // Kiểm tra user
    const [users] = await db.execute(
      `SELECT id
       FROM users
       WHERE id = ?`,
      [userId],
    );

    if (users.length === 0) {
      throw new Error('User không tồn tại');
    }

    return await FavoriteModel.getByUserId(userId);
  },

  // Thêm favorite
  createFavorite: async (data) => {
    const { user_id, product_id } = data;

    // =========================
    // Validate
    // =========================

    if (!user_id) {
      throw new Error('user_id là bắt buộc');
    }

    if (!product_id) {
      throw new Error('product_id là bắt buộc');
    }

    // =========================
    // Kiểm tra user
    // =========================

    const [users] = await db.execute(
      `SELECT id
       FROM users
       WHERE id = ?`,
      [user_id],
    );

    if (users.length === 0) {
      throw new Error('User không tồn tại');
    }

    // =========================
    // Kiểm tra product
    // =========================

    const [products] = await db.execute(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    // =========================
    // Kiểm tra đã favorite chưa
    // =========================

    const existed = await FavoriteModel.getByUserAndProduct(
      user_id,
      product_id,
    );

    if (existed) {
      throw new Error('Product đã có trong danh sách yêu thích');
    }

    // =========================
    // Create
    // =========================

    const id = await FavoriteModel.create(data);

    return await FavoriteModel.getById(id);
  },

  // Xóa favorite
  deleteFavorite: async (id) => {
    const favorite = await FavoriteModel.getById(id);

    if (!favorite) {
      throw new Error('Favorite không tồn tại');
    }

    await FavoriteModel.delete(id);

    return true;
  },

  // Xóa theo user + product
  removeFavorite: async (userId, productId) => {
    const favorite = await FavoriteModel.getByUserAndProduct(userId, productId);

    if (!favorite) {
      throw new Error('Product chưa có trong danh sách yêu thích');
    }

    await FavoriteModel.deleteByUserAndProduct(userId, productId);

    return true;
  },

  // Kiểm tra favorite
  checkFavorite: async (userId, productId) => {
    const favorite = await FavoriteModel.getByUserAndProduct(userId, productId);

    return {
      is_favorite: !!favorite,
      favorite: favorite || null,
    };
  },
};

module.exports = FavoriteService;
