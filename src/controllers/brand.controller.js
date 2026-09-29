const BrandService = require('../services/brand.service');

const BrandController = {
  // GET /api/brands
  getAll: async (req, res) => {
    try {
      const brands = await BrandService.getAllBrands();

      res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/brands/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const brand = await BrandService.getBrandById(id);

      res.status(200).json({
        success: true,
        data: brand,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/brands
  create: async (req, res) => {
    try {
      const brand = await BrandService.createBrand(req.body);

      res.status(201).json({
        success: true,
        message: 'Tạo brand thành công',
        data: brand,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/brands/:id
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const brand = await BrandService.updateBrand(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Cập nhật brand thành công',
        data: brand,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/brands/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      await BrandService.deleteBrand(id);

      res.status(200).json({
        success: true,
        message: 'Xóa brand thành công',
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = BrandController;
