const RoleModel = require('../models/role.model');

const getId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateRole = (body, partial = false) => {
  const { name, description } = body;

  if (!partial && (!name || typeof name !== 'string' || !name.trim())) {
    return 'Tên role là bắt buộc';
  }

  if (
    name !== undefined &&
    (typeof name !== 'string' || !name.trim() || name.trim().length > 50)
  ) {
    return 'Tên role phải là chuỗi và có từ 1 đến 50 ký tự';
  }

  if (
    description !== undefined &&
    description !== null &&
    (typeof description !== 'string' || description.length > 255)
  ) {
    return 'Mô tả role phải là chuỗi và không quá 255 ký tự';
  }

  return null;
};

const throwError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const getAllRoles = async () => RoleModel.findAll();

const getRoleById = async (idValue) => {
  const id = getId(idValue);

  if (!id) throwError('Mã role không hợp lệ', 400);

  const role = await RoleModel.findById(id);
  if (!role) throwError('Không tìm thấy role', 404);

  return role;
};

const createRole = async (data) => {
  const validationError = validateRole(data);
  if (validationError) throwError(validationError, 400);

  const id = await RoleModel.create({
    name: data.name.trim(),
    description:
      data.description === undefined || data.description === null
        ? null
        : data.description.trim(),
  });

  return RoleModel.findById(id);
};

const updateRole = async (idValue, data) => {
  const id = getId(idValue);
  if (!id) throwError('Mã role không hợp lệ', 400);

  const validationError = validateRole(data, true);
  if (validationError) throwError(validationError, 400);

  const current = await RoleModel.findById(id);
  if (!current) throwError('Không tìm thấy role cần cập nhật', 404);

  await RoleModel.update(id, {
    name: data.name !== undefined ? data.name.trim() : current.name,
    description:
      data.description !== undefined
        ? data.description === null
          ? null
          : data.description.trim()
        : current.description,
  });

  return RoleModel.findById(id);
};

const deleteRole = async (idValue) => {
  const id = getId(idValue);
  if (!id) throwError('Mã role không hợp lệ', 400);

  const affectedRows = await RoleModel.remove(id);
  if (!affectedRows) throwError('Không tìm thấy role cần xóa', 404);

  return true;
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
