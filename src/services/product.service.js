const ProductModel = require('../models/product.model');

const allowedStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];

const getId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateProduct = (data, partial = false) => {
  const { categoryId, brandId, name, slug, description, thumbnailUrl, status } =
    data;

  if (
    !partial &&
    (categoryId === undefined || brandId === undefined || !name || !slug)
  ) {
    return 'categoryId, brandId, name và slug là bắt buộc';
  }

  for (const [field, value] of [
    ['categoryId', categoryId],
    ['brandId', brandId],
  ]) {
    if (
      value !== undefined &&
      (!Number.isSafeInteger(Number(value)) || Number(value) <= 0)
    ) {
      return `${field} không hợp lệ`;
    }
  }

  if (
    name !== undefined &&
    (typeof name !== 'string' || !name.trim() || name.trim().length > 255)
  ) {
    return 'Tên sản phẩm phải là chuỗi và có từ 1 đến 255 ký tự';
  }

  if (
    slug !== undefined &&
    (typeof slug !== 'string' || !slug.trim() || slug.trim().length > 280)
  ) {
    return 'Slug sản phẩm phải là chuỗi và có từ 1 đến 280 ký tự';
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    return 'Mô tả sản phẩm phải là chuỗi ký tự';
  }

  if (
    thumbnailUrl !== undefined &&
    thumbnailUrl !== null &&
    typeof thumbnailUrl !== 'string'
  ) {
    return 'thumbnailUrl phải là chuỗi ký tự';
  }

  if (status !== undefined && !allowedStatuses.includes(status)) {
    return 'status chỉ được phép là DRAFT, ACTIVE hoặc INACTIVE';
  }

  return null;
};

const throwError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const getAllProducts = async () => ProductModel.findAll();

const getProductById = async (idValue) => {
  const id = getId(idValue);
  if (!id) throwError('Mã sản phẩm không hợp lệ', 400);

  const product = await ProductModel.findById(id);
  if (!product) throwError('Không tìm thấy sản phẩm', 404);
  return product;
};

const createProduct = async (data) => {
  const validationError = validateProduct(data);
  if (validationError) throwError(validationError, 400);

  const id = await ProductModel.create({
    categoryId: Number(data.categoryId),
    brandId: Number(data.brandId),
    name: data.name.trim(),
    slug: data.slug.trim().toLowerCase(),
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    status: data.status || 'DRAFT',
  });

  return ProductModel.findById(id);
};

const updateProduct = async (idValue, data) => {
  const id = getId(idValue);
  if (!id) throwError('Mã sản phẩm không hợp lệ', 400);

  const validationError = validateProduct(data, true);
  if (validationError) throwError(validationError, 400);

  const current = await ProductModel.findById(id);
  if (!current) throwError('Không tìm thấy sản phẩm cần cập nhật', 404);

  await ProductModel.update(id, {
    categoryId:
      data.categoryId !== undefined
        ? Number(data.categoryId)
        : current.category_id,
    brandId:
      data.brandId !== undefined ? Number(data.brandId) : current.brand_id,
    name: data.name !== undefined ? data.name.trim() : current.name,
    slug:
      data.slug !== undefined ? data.slug.trim().toLowerCase() : current.slug,
    description:
      data.description !== undefined ? data.description : current.description,
    thumbnailUrl:
      data.thumbnailUrl !== undefined
        ? data.thumbnailUrl
        : current.thumbnail_url,
    status: data.status !== undefined ? data.status : current.status,
  });

  return ProductModel.findById(id);
};

const deleteProduct = async (idValue) => {
  const id = getId(idValue);
  if (!id) throwError('Mã sản phẩm không hợp lệ', 400);

  const affectedRows = await ProductModel.remove(id);
  if (!affectedRows) throwError('Không tìm thấy sản phẩm cần xóa', 404);
  return true;
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
