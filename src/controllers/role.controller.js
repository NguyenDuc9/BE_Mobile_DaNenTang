const RoleService = require('../services/role.service');

const getAll = async (req, res) => {
  try {
    return res.json({ data: await RoleService.getAllRoles() });
  } catch (error) {
    console.error('Get all role error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getOne = async (req, res) => {
  try {
    return res.json({ data: await RoleService.getRoleById(req.params.id) });
  } catch (error) {
    console.error('Get one role error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const create = async (req, res) => {
  try {
    return res.status(201).json({
      message: 'Tạo role thành công',
      data: await RoleService.createRole(req.body),
    });
  } catch (error) {
    console.error('Create role error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Tên role đã tồn tại' });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const update = async (req, res) => {
  try {
    return res.json({
      message: 'Cập nhật role thành công',
      data: await RoleService.updateRole(req.params.id, req.body),
    });
  } catch (error) {
    console.error('Update role error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Tên role đã tồn tại' });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

const remove = async (req, res) => {
  try {
    await RoleService.deleteRole(req.params.id);
    return res.json({ message: 'Xóa role thành công' });
  } catch (error) {
    console.error('Delete role error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'Không thể xóa role đang được sử dụng bởi user',
      });
    }
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Lỗi máy chủ',
    });
  }
};

module.exports = { getAll, getOne, create, update, remove };
