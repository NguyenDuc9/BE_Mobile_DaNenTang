const AddressModel = require('../models/address.model');

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
    const {
      receiver_name,
      receiver_phone,
      address_line,
      ward,
      district,
      province,
      latitude,
      longitude,
      is_default,
    } = data;

    // Validate
    if (!receiver_name) {
      throw new Error('Vui lòng nhập tên người nhận');
    }

    if (!receiver_phone) {
      throw new Error('Vui lòng nhập số điện thoại');
    }

    if (!address_line) {
      throw new Error('Vui lòng nhập địa chỉ');
    }

    if (!province) {
      throw new Error('Vui lòng nhập tỉnh/thành phố');
    }

    // Nếu đặt làm mặc định
    if (is_default === true) {
      await AddressModel.clearDefaultByUserId(userId);
    }

    const id = await AddressModel.create({
      user_id: userId,
      receiver_name,
      receiver_phone,
      address_line,
      ward,
      district,
      province,
      latitude,
      longitude,
      is_default,
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

    const {
      receiver_name,
      receiver_phone,
      address_line,
      ward,
      district,
      province,
      latitude,
      longitude,
      is_default,
    } = data;

    if (!receiver_name) {
      throw new Error('Vui lòng nhập tên người nhận');
    }

    if (!receiver_phone) {
      throw new Error('Vui lòng nhập số điện thoại');
    }

    if (!address_line) {
      throw new Error('Vui lòng nhập địa chỉ');
    }

    if (!province) {
      throw new Error('Vui lòng nhập tỉnh/thành phố');
    }

    // Nếu cập nhật thành mặc định
    if (is_default === true) {
      await AddressModel.clearDefaultByUserId(userId);
    }

    await AddressModel.update(id, {
      receiver_name,
      receiver_phone,
      address_line,
      ward,
      district,
      province,
      latitude,
      longitude,
      is_default,
    });

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
