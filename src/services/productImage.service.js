const ProductImageModel = require('../models/productImage.model');
const db = require('../common/common');
const UploadModel = require('../models/upload.model');

const getUploadedFilename = (imageUrl) => {
  if (typeof imageUrl !== 'string') return null;
  const match = imageUrl.match(
    /^\/api\/uploads\/([0-9a-f-]+\.(?:jpg|png|webp|gif))$/i,
  );
  return match ? match[1] : null;
};

const fail = (message, statusCode) => {
  throw Object.assign(new Error(message), { statusCode });
};

const resolveSortOrder = async (productId, input, excludeId = null) => {
  if (input === undefined || input === null || input === '') {
    const [rows] = await db.execute(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_sort_order
       FROM product_images WHERE product_id = ?`,
      [productId],
    );
    return Number(rows[0].next_sort_order);
  }

  const sortOrder = Number(input);
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
    fail('Thứ tự ảnh phải là số nguyên không âm', 400);
  }

  const [duplicates] =
    excludeId === null
      ? await db.execute(
          `SELECT id FROM product_images
         WHERE product_id = ? AND sort_order = ? LIMIT 1`,
          [productId, sortOrder],
        )
      : await db.execute(
          `SELECT id FROM product_images
         WHERE product_id = ? AND sort_order = ? AND id != ? LIMIT 1`,
          [productId, sortOrder, excludeId],
        );
  if (duplicates.length > 0) {
    fail('Thứ tự ảnh đã được sử dụng cho sản phẩm này', 409);
  }

  return sortOrder;
};

const removeUploadedFile = async (imageUrl) => {
  const filename = getUploadedFilename(imageUrl);
  if (!filename) return;
  try {
    await UploadModel.remove(filename);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw Object.assign(new Error('Không thể xóa file ảnh đã lưu'), {
        statusCode: 500,
        cause: error,
      });
    }
  }
};

const ProductImageService = {
  // Lấy tất cả ảnh
  getAllImages: async () => {
    return await ProductImageModel.getAll();
  },

  // Lấy ảnh theo id
  getImageById: async (id) => {
    const image = await ProductImageModel.getById(id);

    if (!image) {
      fail('Product image không tồn tại', 404);
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
      fail('Product không tồn tại', 404);
    }

    const resolvedSortOrder = await resolveSortOrder(product_id, sort_order);
    const imageData = { ...data, sort_order: resolvedSortOrder };

    return await ProductImageModel.getByProductId(productId);
  },

  // Tạo ảnh
  createImage: async (data) => {
    const { product_id, image_url, sort_order, is_primary } = data;

    // Validate
    if (!product_id) {
      fail('product_id là bắt buộc', 400);
    }

    if (!image_url) {
      fail('image_url là bắt buộc', 400);
    }

    // Kiểm tra product tồn tại
    const [products] = await db.execute(
      `SELECT id FROM products WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      fail('Product không tồn tại', 404);
    }

    // Nếu ảnh mới là ảnh chính
    // thì bỏ ảnh chính cũ
    const id =
      is_primary === true || is_primary === 1
        ? await db.withTransaction(async (connection) => {
            await connection.execute(
              'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
              [product_id],
            );
            const [result] = await connection.execute(
              `INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
             VALUES (?, ?, ?, TRUE)`,
              [product_id, image_url, resolvedSortOrder],
            );
            return result.insertId;
          })
        : await ProductImageModel.create(imageData);

    return await ProductImageModel.getById(id);
  },

  // Cập nhật ảnh
  updateImage: async (id, data) => {
    const image = await ProductImageModel.getById(id);

    if (!image) {
      fail('Product image không tồn tại', 404);
    }

    const { product_id, image_url, sort_order, is_primary } = data;

    if (!product_id) {
      fail('product_id là bắt buộc', 400);
    }

    if (!image_url) {
      fail('image_url là bắt buộc', 400);
    }

    // Kiểm tra product tồn tại
    const [products] = await db.execute(
      `SELECT id FROM products WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      fail('Product không tồn tại', 404);
    }

    const resolvedSortOrder = await resolveSortOrder(
      product_id,
      sort_order,
      id,
    );
    const imageData = { ...data, sort_order: resolvedSortOrder };

    // Nếu set ảnh này thành ảnh chính
    const save = async (connection) => {
      if (is_primary === true || is_primary === 1) {
        await connection.execute(
          `UPDATE product_images
           SET is_primary = FALSE
           WHERE product_id = ? AND id != ?`,
          [product_id, id],
        );
      }
      await connection.execute(
        `UPDATE product_images
         SET product_id = ?, image_url = ?, sort_order = ?, is_primary = ?
         WHERE id = ?`,
        [product_id, image_url, resolvedSortOrder, is_primary ?? false, id],
      );
    };

    if (is_primary === true || is_primary === 1) {
      await db.withTransaction(save);
    } else {
      await ProductImageModel.update(id, imageData);
    }

    if (image.image_url !== image_url) {
      await removeUploadedFile(image.image_url);
    }
    return ProductImageModel.getById(id);
  },

  // Xóa ảnh
  deleteImage: async (id) => {
    const image = await ProductImageModel.getById(id);

    if (!image) {
      fail('Product image không tồn tại', 404);
    }

    await ProductImageModel.delete(id);
    await removeUploadedFile(image.image_url);

    return true;
  },
};

module.exports = ProductImageService;
