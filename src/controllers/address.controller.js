const AddressService = require('../services/address.service');

const AddressController = {
  // GET /api/addresses
  getAll: async (req, res) => {
    try {
      const userId = req.user.id;

      const addresses = await AddressService.getAll(userId);

      return res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/addresses/:id
  getById: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const address = await AddressService.getById(id, userId);

      return res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/addresses
  create: async (req, res) => {
    try {
      const userId = req.user.id;

      const address = await AddressService.create(userId, req.body);

      return res.status(201).json({
        success: true,
        message: 'Thêm địa chỉ thành công',
        data: address,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/addresses/:id
  update: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const address = await AddressService.update(id, userId, req.body);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật địa chỉ thành công',
        data: address,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/addresses/:id
  delete: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await AddressService.delete(id, userId);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PATCH /api/addresses/:id/default
  setDefault: async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const address = await AddressService.setDefault(id, userId);

      return res.status(200).json({
        success: true,
        message: 'Đặt địa chỉ mặc định thành công',
        data: address,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = AddressController;
