const AddressModel = require('../models/address.model');

const fail = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
};

const normalizeAddress = (data = {}) => {
  const requiredText = (value, label, maxLength) => {
    if (typeof value !== 'string' || !value.trim()) {
      fail(`${label} là bắt buộc`);
    }
    const normalized = value.trim();
    if (normalized.length > maxLength) {
      fail(`${label} không được vượt quá ${maxLength} ký tự`);
    }
    return normalized;
  };
  const optionalText = (value, label, maxLength) => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string') fail(`${label} không hợp lệ`);
    const normalized = value.trim();
    if (normalized.length > maxLength) {
      fail(`${label} không được vượt quá ${maxLength} ký tự`);
    }
    return normalized || null;
  };

  const receiverName = requiredText(data.receiver_name, 'Tên người nhận', 150);
  const receiverPhone = requiredText(data.receiver_phone, 'Số điện thoại', 20)
    .replace(/\s/g, '');
  if (!/^(?:\+84|0)\d{9,10}$/.test(receiverPhone)) {
    fail('Số điện thoại Việt Nam không hợp lệ');
  }

  const hasLatitude = data.latitude !== undefined && data.latitude !== null && data.latitude !== '';
  const hasLongitude = data.longitude !== undefined && data.longitude !== null && data.longitude !== '';
  if (hasLatitude !== hasLongitude) {
    fail('latitude và longitude phải được gửi cùng nhau');
  }

  let latitude = null;
  let longitude = null;
  if (hasLatitude && hasLongitude) {
    latitude = Number(data.latitude);
    longitude = Number(data.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      fail('latitude phải nằm trong khoảng -90 đến 90');
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      fail('longitude phải nằm trong khoảng -180 đến 180');
    }
  }

  return {
    receiver_name: receiverName,
    receiver_phone: receiverPhone,
    address_line: requiredText(data.address_line, 'Địa chỉ', 255),
    ward: optionalText(data.ward, 'Phường/xã', 100),
    district: optionalText(data.district, 'Quận/huyện', 100),
    province: requiredText(data.province, 'Tỉnh/thành phố', 100),
    latitude,
    longitude,
    is_default: data.is_default === true || Number(data.is_default) === 1,
  };
};

const AddressService = {
  // =========================
  // LẤY DANH SÁCH
  // =========================
  getAll: async (userId) => {
    return await AddressModel.findByUserId(userId);
  },

  // =========================
  // LẤY CHI TIẾT
  // =========================
  getById: async (id, userId) => {
    const address = await AddressModel.findById(id);

    if (!address) {
      throw new Error('Địa chỉ không tồn tại');
    }

    if (Number(address.user_id) !== Number(userId)) {
      throw new Error('Bạn không có quyền truy cập địa chỉ này');
    }

    return address;
  },

  // =========================
  // TẠO ĐỊA CHỈ
  // =========================
  create: async (userId, data) => {
    const normalized = normalizeAddress(data);

    // Nếu đặt làm mặc định
    if (normalized.is_default) {
      await AddressModel.clearDefaultByUserId(userId);
    }

    const id = await AddressModel.create({
      user_id: userId,
      ...normalized,
    });

    return await AddressModel.findById(id);
  },

  // =========================
  // CẬP NHẬT
  // =========================
  update: async (id, userId, data) => {
    const address = await AddressModel.findById(id);

    if (!address) {
      throw new Error('Địa chỉ không tồn tại');
    }

    if (Number(address.user_id) !== Number(userId)) {
      throw new Error('Bạn không có quyền cập nhật địa chỉ này');
    }

    const normalized = normalizeAddress(data);

    // Nếu cập nhật thành mặc định
    if (normalized.is_default) {
      await AddressModel.clearDefaultByUserId(userId);
    }

    await AddressModel.update(id, normalized);

    return await AddressModel.findById(id);
  },

  // =========================
  // XÓA
  // =========================
  delete: async (id, userId) => {
    const address = await AddressModel.findById(id);

    if (!address) {
      throw new Error('Địa chỉ không tồn tại');
    }

    if (Number(address.user_id) !== Number(userId)) {
      throw new Error('Bạn không có quyền xóa địa chỉ này');
    }

    await AddressModel.delete(id);

    return {
      message: 'Xóa địa chỉ thành công',
    };
  },

  // =========================
  // ĐẶT ĐỊA CHỈ MẶC ĐỊNH
  // =========================
  setDefault: async (id, userId) => {
    const address = await AddressModel.findById(id);

    if (!address) {
      throw new Error('Địa chỉ không tồn tại');
    }

    if (Number(address.user_id) !== Number(userId)) {
      throw new Error('Bạn không có quyền sử dụng địa chỉ này');
    }

    // Bỏ mặc định các địa chỉ khác
    await AddressModel.clearDefaultByUserId(userId);

    // Đặt địa chỉ hiện tại làm mặc định
    await AddressModel.setDefault(id);

    return await AddressModel.findById(id);
  },
};

module.exports = AddressService;
