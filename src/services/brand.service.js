const BrandModel = require('../models/brand.models');

const BrandService = {
  // Lấy tất cả
  getAllBrands: async () => {
    return await BrandModel.getAll();
  },

  // Lấy theo id
  getBrandById: async (id) => {
    const brand = await BrandModel.getById(id);

    if (!brand) {
      throw new Error('Brand không tồn tại');
    }

    return brand;
  },

  // Tạo
  createBrand: async (data) => {
    const { name, slug, status } = data;

    if (!name || !slug) {
      throw new Error('Name và slug là bắt buộc');
    }

    if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new Error('Status phải là ACTIVE hoặc INACTIVE');
    }

    // Kiểm tra name hoặc slug đã tồn tại
    const brands = await BrandModel.getAll();

    const existedName = brands.find(
      (brand) => brand.name.toLowerCase() === name.toLowerCase(),
    );

    if (existedName) {
      throw new Error('Tên brand đã tồn tại');
    }

    const existedSlug = brands.find(
      (brand) => brand.slug.toLowerCase() === slug.toLowerCase(),
    );

    if (existedSlug) {
      throw new Error('Slug đã tồn tại');
    }

    const id = await BrandModel.create(data);

    return await BrandModel.getById(id);
  },

  // Cập nhật
  updateBrand: async (id, data) => {
    const brand = await BrandModel.getById(id);

    if (!brand) {
      throw new Error('Brand không tồn tại');
    }

    const { name, slug, status } = data;

    if (!name || !slug) {
      throw new Error('Name và slug là bắt buộc');
    }

    if (status && !['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new Error('Status phải là ACTIVE hoặc INACTIVE');
    }

    const brands = await BrandModel.getAll();

    const existedName = brands.find(
      (item) =>
        item.id !== Number(id) &&
        item.name.toLowerCase() === name.toLowerCase(),
    );

    if (existedName) {
      throw new Error('Tên brand đã tồn tại');
    }

    const existedSlug = brands.find(
      (item) =>
        item.id !== Number(id) &&
        item.slug.toLowerCase() === slug.toLowerCase(),
    );

    if (existedSlug) {
      throw new Error('Slug đã tồn tại');
    }

    await BrandModel.update(id, data);

    return await BrandModel.getById(id);
  },

  // Xóa
  deleteBrand: async (id) => {
    const brand = await BrandModel.getById(id);

    if (!brand) {
      throw new Error('Brand không tồn tại');
    }

    await BrandModel.delete(id);

    return true;
  },
};

module.exports = BrandService;
