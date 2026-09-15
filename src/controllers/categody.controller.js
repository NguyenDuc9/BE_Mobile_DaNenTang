const CategoryService = require('../services/categogy.service');

// =========================
// GET /categories
// =========================

const getAll = async (req, res) => {
  try {
    const categories = await CategoryService.getAllCategories();

    return res.json({
      data: categories,
    });
  } catch (error) {
    console.error('Get all category error:', error);

    return res.status(500).json({
      message: 'Lỗi máy chủ',
    });
  }
};

// =========================
// GET /categories/:id
// =========================

const getOne = async (req, res) => {
  try {
    const category = await CategoryService.getCategoryById(req.params.id);

    return res.json({
      data: category,
    });
  } catch (error) {
    console.error('Get one category error:', error);

    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

// =========================
// POST /categories
// =========================

const create = async (req, res) => {
  try {
    const category = await CategoryService.createCategory(req.body);

    return res.status(201).json({
      message: 'Tạo category thành công',
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Tên hoặc slug category đã tồn tại',
      });
    }

    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

// =========================
// PUT /categories/:id
// =========================

const update = async (req, res) => {
  try {
    const category = await CategoryService.updateCategory(
      req.params.id,
      req.body,
    );

    return res.json({
      message: 'Cập nhật category thành công',
      data: category,
    });
  } catch (error) {
    console.error('Update category error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Tên hoặc slug category đã tồn tại',
      });
    }

    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

// =========================
// DELETE /categories/:id
// =========================

const remove = async (req, res) => {
  try {
    await CategoryService.deleteCategory(req.params.id);

    return res.json({
      message: 'Xóa category thành công',
    });
  } catch (error) {
    console.error('Delete category error:', error);

    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

module.exports = {
  getAll,
  getOne,
  create,
  update,
  remove,
};
