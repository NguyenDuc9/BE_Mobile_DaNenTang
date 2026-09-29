const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');

const allowedStatuses = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

const getId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const validateUser = (data, partial = false) => {
  const { roleId, fullName, email, phone, password, avatarUrl, status } = data;

  if (!partial && (roleId === undefined || !fullName || !email || !password)) {
    return 'roleId, fullName, email và password là bắt buộc';
  }
  if (
    roleId !== undefined &&
    (!Number.isSafeInteger(Number(roleId)) || Number(roleId) <= 0)
  ) {
    return 'roleId không hợp lệ';
  }
  if (
    fullName !== undefined &&
    (typeof fullName !== 'string' ||
      !fullName.trim() ||
      fullName.trim().length > 150)
  ) {
    return 'Họ tên phải là chuỗi và có từ 1 đến 150 ký tự';
  }
  if (
    email !== undefined &&
    (typeof email !== 'string' || !email.trim() || email.trim().length > 150)
  ) {
    return 'Email phải là chuỗi và có từ 1 đến 150 ký tự';
  }
  if (
    phone !== undefined &&
    phone !== null &&
    (typeof phone !== 'string' || phone.length > 20)
  ) {
    return 'Số điện thoại không hợp lệ';
  }
  if (
    password !== undefined &&
    (typeof password !== 'string' || password.length < 6)
  ) {
    return 'Mật khẩu phải có ít nhất 6 ký tự';
  }
  if (
    avatarUrl !== undefined &&
    avatarUrl !== null &&
    typeof avatarUrl !== 'string'
  ) {
    return 'avatarUrl phải là chuỗi ký tự';
  }
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return 'status chỉ được phép là ACTIVE, INACTIVE hoặc BLOCKED';
  }

  return null;
};

const throwError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const getAllUsers = async () => UserModel.findAll();

const getUserById = async (idValue) => {
  const id = getId(idValue);
  if (!id) throwError('Mã user không hợp lệ', 400);

  const user = await UserModel.findById(id);
  if (!user) throwError('Không tìm thấy user', 404);
  return user;
};

const createUser = async (data) => {
  const validationError = validateUser(data);
  if (validationError) throwError(validationError, 400);

  const id = await UserModel.create({
    roleId: Number(data.roleId),
    fullName: data.fullName.trim(),
    email: normalizeEmail(data.email),
    phone: data.phone,
    passwordHash: await bcrypt.hash(data.password, 12),
    avatarUrl: data.avatarUrl,
    status: data.status || 'ACTIVE',
  });

  return UserModel.findById(id);
};

const updateUser = async (idValue, data) => {
  const id = getId(idValue);
  if (!id) throwError('Mã user không hợp lệ', 400);

  const validationError = validateUser(data, true);
  if (validationError) throwError(validationError, 400);

  const current = await UserModel.findById(id);
  if (!current) throwError('Không tìm thấy user cần cập nhật', 404);

  await UserModel.update(id, {
    roleId: data.roleId !== undefined ? Number(data.roleId) : current.role_id,
    fullName:
      data.fullName !== undefined ? data.fullName.trim() : current.full_name,
    email:
      data.email !== undefined ? normalizeEmail(data.email) : current.email,
    phone: data.phone !== undefined ? data.phone : current.phone,
    passwordHash:
      data.password !== undefined
        ? await bcrypt.hash(data.password, 12)
        : undefined,
    avatarUrl:
      data.avatarUrl !== undefined ? data.avatarUrl : current.avatar_url,
    status: data.status !== undefined ? data.status : current.status,
  });

  return UserModel.findById(id);
};

const deleteUser = async (idValue) => {
  const id = getId(idValue);
  if (!id) throwError('Mã user không hợp lệ', 400);

  const affectedRows = await UserModel.remove(id);
  if (!affectedRows) throwError('Không tìm thấy user cần xóa', 404);
  return true;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
