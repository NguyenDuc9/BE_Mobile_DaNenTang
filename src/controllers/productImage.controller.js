const ProductImageService = require('../services/productImage.service');

const ProductImageController = {
  // GET /api/product-images
  getAll: async (req, res) => {
    try {
      const images = await ProductImageService.getAllImages();

      res.status(200).json({
        success: true,
        data: images,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/product-images/:id
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const image = await ProductImageService.getImageById(id);

      res.status(200).json({
        success: true,
        data: image,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // GET /api/product-images/product/:productId
  getByProductId: async (req, res) => {
    try {
      const { productId } = req.params;

      const images = await ProductImageService.getImagesByProductId(productId);

      res.status(200).json({
        success: true,
        data: images,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  // POST /api/product-images
  create: async (req, res) => {
    try {
      const image = await ProductImageService.createImage(req.body);

      res.status(201).json({
        success: true,
        message: 'Thêm product image thành công',
        data: image,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // PUT /api/product-images/:id
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const image = await ProductImageService.updateImage(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Cập nhật product image thành công',
        data: image,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // DELETE /api/product-images/:id
  delete: async (req, res) => {
    try {
      const { id } = req.params;

      await ProductImageService.deleteImage(id);

      res.status(200).json({
        success: true,
        message: 'Xóa product image thành công',
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = ProductImageController;
