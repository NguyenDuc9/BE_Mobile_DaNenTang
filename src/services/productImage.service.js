const ProductImageModel = require('../models/productImage.model');
const db = require('../common/common');

const ProductImageService = {
  // Lấy tất cả ảnh
  getAllImages: async () => {
    return await ProductImageModel.getAll();
  },

  // Lấy ảnh theo id
  getImageById: async (id) => {
    const image = await ProductImageModel.getById(id);

    if (!image) {
      throw new Error('Product image không tồn tại');
    }

    return image;
  },

  // Lấy ảnh theo product
  getImagesByProductId: async (productId) => {
    const [products] = await db.execute(
      `SELECT id FROM products WHERE id = ?`,
      [productId],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    return await ProductImageModel.getByProductId(productId);
  },

  // Tạo ảnh
  createImage: async (data) => {
    const { product_id, image_url, sort_order, is_primary } = data;

    // Validate
    if (!product_id) {
      throw new Error('product_id là bắt buộc');
    }

    if (!image_url) {
      throw new Error('image_url là bắt buộc');
    }

    // Kiểm tra product tồn tại
    const [products] = await db.execute(
      `SELECT id FROM products WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    // Nếu ảnh mới là ảnh chính
    // thì bỏ ảnh chính cũ
    if (is_primary === true || is_primary === 1) {
      await db.execute(
        `UPDATE product_images
         SET is_primary = FALSE
         WHERE product_id = ?`,
        [product_id],
      );
    }

    const id = await ProductImageModel.create(data);

    return await ProductImageModel.getById(id);
  },

  // Cập nhật ảnh
  updateImage: async (id, data) => {
    const image = await ProductImageModel.getById(id);

    if (!image) {
      throw new Error('Product image không tồn tại');
    }

    const { product_id, image_url, sort_order, is_primary } = data;

    if (!product_id) {
      throw new Error('product_id là bắt buộc');
    }

    if (!image_url) {
      throw new Error('image_url là bắt buộc');
    }

    // Kiểm tra product tồn tại
    const [products] = await db.execute(
      `SELECT id FROM products WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    // Nếu set ảnh này thành ảnh chính
    if (is_primary === true || is_primary === 1) {
      await db.execute(
        `UPDATE product_images
         SET is_primary = FALSE
         WHERE product_id = ?
         AND id != ?`,
        [product_id, id],
      );
    }

    await ProductImageModel.update(id, data);

    return await ProductImageModel.getById(id);
  },

  // Xóa ảnh
  deleteImage: async (id) => {
    const image = await ProductImageModel.getById(id);

    if (!image) {
      throw new Error('Product image không tồn tại');
    }

    await ProductImageModel.delete(id);

    return true;
  },
};

module.exports = ProductImageService;
