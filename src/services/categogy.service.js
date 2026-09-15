const CategoryModel = require('../models/category.model');

const allowedStatuses = ['ACTIVE', 'INACTIVE'];

// =========================
// Helpers
// =========================

const getId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateCategory = (body, partial = false) => {
  const { name, slug, description, imageUrl, status } = body;

  // CREATE: name và slug bắt buộc
  if (!partial && (!name || !slug)) {
    return 'Tên danh mục và đường dẫn danh mục là bắt buộc';
  }

  // name
  if (
    name !== undefined &&
    (typeof name !== 'string' || !name.trim() || name.trim().length > 100)
  ) {
    return 'Tên danh mục phải là chuỗi và có từ 1 đến 100 ký tự';
  }

  // slug
  if (
    slug !== undefined &&
    (typeof slug !== 'string' || !slug.trim() || slug.trim().length > 120)
  ) {
    return 'Đường dẫn danh mục phải là chuỗi và có từ 1 đến 120 ký tự';
  }

  // description
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    return 'Mô tả danh mục phải là chuỗi ký tự';
  }

  // imageUrl
  if (
    imageUrl !== undefined &&
    imageUrl !== null &&
    typeof imageUrl !== 'string'
  ) {
    return 'Đường dẫn hình ảnh phải là chuỗi ký tự';
  }

  // status
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return 'Trạng thái danh mục chỉ được phép là ACTIVE hoặc INACTIVE';
  }

  return null;
};

// =========================
// Lấy tất cả danh mục
// =========================

const getAllCategories = async () => {
  return await CategoryModel.findAll();
};

// =========================
// Lấy danh mục theo ID
// =========================

const getCategoryById = async (idValue) => {
  const id = getId(idValue);

  if (!id) {
    const error = new Error('Mã danh mục không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const category = await CategoryModel.findById(id);

  if (!category) {
    const error = new Error('Không tìm thấy danh mục');
    error.statusCode = 404;
    throw error;
  }

  return category;
};

// =========================
// Tạo danh mục
// =========================

const createCategory = async (data) => {
  const validationError = validateCategory(data);

  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const { name, slug, description, imageUrl, status = 'ACTIVE' } = data;

  const id = await CategoryModel.create({
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    description,
    imageUrl,
    status,
  });

  return await CategoryModel.findById(id);
};

// =========================
// Cập nhật danh mục
// =========================

const updateCategory = async (idValue, data) => {
  const id = getId(idValue);

  if (!id) {
    const error = new Error('Mã danh mục không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const validationError = validateCategory(data, true);

  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 400;
    throw error;
  }

  const current = await CategoryModel.findById(id);

  if (!current) {
    const error = new Error('Không tìm thấy danh mục cần cập nhật');
    error.statusCode = 404;
    throw error;
  }

  await CategoryModel.update(id, {
    name: data.name !== undefined ? data.name.trim() : current.name,

    slug:
      data.slug !== undefined ? data.slug.trim().toLowerCase() : current.slug,

    description:
      data.description !== undefined ? data.description : current.description,

    imageUrl: data.imageUrl !== undefined ? data.imageUrl : current.image_url,

    status: data.status !== undefined ? data.status : current.status,
  });

  return await CategoryModel.findById(id);
};

// =========================
// Xóa danh mục
// =========================

const deleteCategory = async (idValue) => {
  const id = getId(idValue);

  if (!id) {
    const error = new Error('Mã danh mục không hợp lệ');
    error.statusCode = 400;
    throw error;
  }

  const affectedRows = await CategoryModel.remove(id);

  if (!affectedRows) {
    const error = new Error('Không tìm thấy danh mục cần xóa');
    error.statusCode = 404;
    throw error;
  }

  return true;
};

// =========================
// Export
// =========================

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
