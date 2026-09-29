const ProductVariantModel = require('../models/productVariant.model');
const db = require('../common/common');

const ProductVariantService = {
  // Lấy tất cả
  getAllVariants: async () => {
    return await ProductVariantModel.getAll();
  },

  // Lấy theo ID
  getVariantById: async (id) => {
    const variant = await ProductVariantModel.getById(id);

    if (!variant) {
      throw new Error('Product variant không tồn tại');
    }

    return variant;
  },

  // Lấy theo product_id
  getVariantsByProductId: async (productId) => {
    const [products] = await db.execute(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [productId],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    return await ProductVariantModel.getByProductId(productId);
  },

  // Tạo variant
  createVariant: async (data) => {
    const {
      product_id,
      sku,
      variant_name,
      price,
      compare_at_price,
      stock_quantity,
      weight_kg,
      warranty_months,
      status,
    } = data;

    // =========================
    // Validate bắt buộc
    // =========================

    if (!product_id) {
      throw new Error('product_id là bắt buộc');
    }

    if (!sku) {
      throw new Error('sku là bắt buộc');
    }

    if (!variant_name) {
      throw new Error('variant_name là bắt buộc');
    }

    // =========================
    // Validate product
    // =========================

    const [products] = await db.execute(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    // =========================
    // Kiểm tra SKU
    // =========================

    const existedSku = await ProductVariantModel.getBySku(sku);

    if (existedSku) {
      throw new Error('SKU đã tồn tại');
    }

    // =========================
    // Validate price
    // =========================

    if (price !== undefined && Number(price) < 0) {
      throw new Error('Price không được nhỏ hơn 0');
    }

    if (
      compare_at_price !== undefined &&
      compare_at_price !== null &&
      Number(compare_at_price) < 0
    ) {
      throw new Error('compare_at_price không được nhỏ hơn 0');
    }

    // =========================
    // Validate stock
    // =========================

    if (stock_quantity !== undefined && Number(stock_quantity) < 0) {
      throw new Error('stock_quantity không được nhỏ hơn 0');
    }

    // =========================
    // Validate weight
    // =========================

    if (
      weight_kg !== undefined &&
      weight_kg !== null &&
      Number(weight_kg) < 0
    ) {
      throw new Error('weight_kg không được nhỏ hơn 0');
    }

    // =========================
    // Validate warranty
    // =========================

    if (warranty_months !== undefined && Number(warranty_months) < 0) {
      throw new Error('warranty_months không được nhỏ hơn 0');
    }

    // =========================
    // Validate status
    // =========================

    if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new Error('Status phải là ACTIVE hoặc INACTIVE');
    }

    // =========================
    // Create
    // =========================

    const id = await ProductVariantModel.create(data);

    return await ProductVariantModel.getById(id);
  },

  // Cập nhật variant
  updateVariant: async (id, data) => {
    const variant = await ProductVariantModel.getById(id);

    if (!variant) {
      throw new Error('Product variant không tồn tại');
    }

    const {
      product_id,
      sku,
      variant_name,
      price,
      compare_at_price,
      stock_quantity,
      weight_kg,
      warranty_months,
      status,
    } = data;

    // =========================
    // Validate bắt buộc
    // =========================

    if (!product_id) {
      throw new Error('product_id là bắt buộc');
    }

    if (!sku) {
      throw new Error('sku là bắt buộc');
    }

    if (!variant_name) {
      throw new Error('variant_name là bắt buộc');
    }

    // =========================
    // Validate product
    // =========================

    const [products] = await db.execute(
      `SELECT id
       FROM products
       WHERE id = ?`,
      [product_id],
    );

    if (products.length === 0) {
      throw new Error('Product không tồn tại');
    }

    // =========================
    // Kiểm tra SKU
    // =========================

    const existedSku = await ProductVariantModel.getBySku(sku);

    if (existedSku && Number(existedSku.id) !== Number(id)) {
      throw new Error('SKU đã tồn tại');
    }

    // =========================
    // Validate price
    // =========================

    if (price !== undefined && Number(price) < 0) {
      throw new Error('Price không được nhỏ hơn 0');
    }

    if (
      compare_at_price !== undefined &&
      compare_at_price !== null &&
      Number(compare_at_price) < 0
    ) {
      throw new Error('compare_at_price không được nhỏ hơn 0');
    }

    // =========================
    // Validate stock
    // =========================

    if (stock_quantity !== undefined && Number(stock_quantity) < 0) {
      throw new Error('stock_quantity không được nhỏ hơn 0');
    }

    // =========================
    // Validate weight
    // =========================

    if (
      weight_kg !== undefined &&
      weight_kg !== null &&
      Number(weight_kg) < 0
    ) {
      throw new Error('weight_kg không được nhỏ hơn 0');
    }

    // =========================
    // Validate warranty
    // =========================

    if (warranty_months !== undefined && Number(warranty_months) < 0) {
      throw new Error('warranty_months không được nhỏ hơn 0');
    }

    // =========================
    // Validate status
    // =========================

    if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new Error('Status phải là ACTIVE hoặc INACTIVE');
    }

    // =========================
    // Update
    // =========================

    await ProductVariantModel.update(id, data);

    return await ProductVariantModel.getById(id);
  },

  // Xóa variant
  deleteVariant: async (id) => {
    const variant = await ProductVariantModel.getById(id);

    if (!variant) {
      throw new Error('Product variant không tồn tại');
    }

    await ProductVariantModel.delete(id);

    return true;
  },
};

module.exports = ProductVariantService;
