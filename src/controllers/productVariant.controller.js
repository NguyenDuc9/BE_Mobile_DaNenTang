const ProductVariantService = require('../services/productVariant.service');

const ProductVariantController = {
  // GET /api/product-variants
  getAll: async (req, res) => {
    try {
      const variants = await ProductVariantService.getAllVariants();

      res.status(200).json({
        success: true,
        data: variants,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/product-variants/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const variant = await ProductVariantService.getVariantById(id);

      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/product-variants/product/:productId
  getByProductId: async (req, res) => {
    try {
      const { productId } = req.params;

      const variants =
        await ProductVariantService.getVariantsByProductId(productId);

      res.status(200).json({
        success: true,
        data: variants,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/product-variants
  create: async (req, res) => {
    try {
      const variant = await ProductVariantService.createVariant(req.body);

      res.status(201).json({
        success: true,
        message: 'Tạo product variant thành công',
        data: variant,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/product-variants/:id
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const variant = await ProductVariantService.updateVariant(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Cập nhật product variant thành công',
        data: variant,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/product-variants/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      await ProductVariantService.deleteVariant(id);

      res.status(200).json({
        success: true,
        message: 'Xóa product variant thành công',
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = ProductVariantController;
