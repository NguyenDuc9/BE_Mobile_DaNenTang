const FavoriteModel = require('../models/favorite.model');

const parseId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error('productId không hợp lệ');
    error.statusCode = 400;
    throw error;
  }
  return id;
};

const list = (userId) => FavoriteModel.list(userId);

const status = async (userId, productIdValue) => ({
  favorited: await FavoriteModel.exists(userId, parseId(productIdValue)),
});

const add = async (userId, productIdValue) => {
  const productId = parseId(productIdValue);
  const id = await FavoriteModel.add(userId, productId);
  if (!id) {
    const error = new Error('Sản phẩm không tồn tại hoặc không hoạt động');
    error.statusCode = 404;
    throw error;
  }
  return { id, productId, favorited: true };
};

const remove = async (userId, productIdValue) => {
  const productId = parseId(productIdValue);
  await FavoriteModel.remove(userId, productId);
  return { productId, favorited: false };
};

module.exports = { list, status, add, remove };

