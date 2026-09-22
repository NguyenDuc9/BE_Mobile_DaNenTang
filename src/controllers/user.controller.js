const UserService = require('../services/user.service');

const getAll = async (req, res) => {
  try {
    return res.json({ data: await UserService.getAllUsers() });
  } catch (error) {
    console.error('Get all user error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getOne = async (req, res) => {
  try {
    return res.json({ data: await UserService.getUserById(req.params.id) });
  } catch (error) {
    console.error('Get one user error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const create = async (req, res) => {
  try {
    return res.status(201).json({
      message: 'Tạo user thành công',
      data: await UserService.createUser(req.body),
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Email hoặc số điện thoại đã được sử dụng',
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'roleId không tồn tại' });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const update = async (req, res) => {
  try {
    return res.json({
      message: 'Cập nhật user thành công',
      data: await UserService.updateUser(req.params.id, req.body),
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Email hoặc số điện thoại đã được sử dụng',
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'roleId không tồn tại' });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const remove = async (req, res) => {
  try {
    await UserService.deleteUser(req.params.id);
    return res.json({ message: 'Xóa user thành công' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'Không thể xóa user đang được sử dụng bởi dữ liệu khác',
      });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

module.exports = { getAll, getOne, create, update, remove };
