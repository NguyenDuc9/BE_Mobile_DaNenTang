const ProductService = require('../services/product.service');

const getAll = async (req, res) => {
  try {
    return res.json({ data: await ProductService.getAllProducts() });
  } catch (error) {
    console.error('Get all product error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getOne = async (req, res) => {
  try {
    return res.json({
      data: await ProductService.getProductById(req.params.id),
    });
  } catch (error) {
    console.error('Get one product error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const create = async (req, res) => {
  try {
    return res.status(201).json({
      message: 'Tạo sản phẩm thành công',
      data: await ProductService.createProduct(req.body),
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Slug sản phẩm đã tồn tại' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        message: 'categoryId hoặc brandId không tồn tại',
      });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const update = async (req, res) => {
  try {
    return res.json({
      message: 'Cập nhật sản phẩm thành công',
      data: await ProductService.updateProduct(req.params.id, req.body),
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Slug sản phẩm đã tồn tại' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        message: 'categoryId hoặc brandId không tồn tại',
      });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const remove = async (req, res) => {
  try {
    await ProductService.deleteProduct(req.params.id);
    return res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'Không thể xóa sản phẩm đang có biến thể',
      });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

module.exports = { getAll, getOne, create, update, remove };
