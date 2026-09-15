const CategoryModel = require('../models/category.model');

const allowedStatuses = ['ACTIVE', 'INACTIVE'];

const getId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const validateCategory = (body, partial = false) => {
  const { name, slug, description, imageUrl, status } = body;

  if (!partial && (!name || !slug)) {
    return 'name và slug là bắt buộc';
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) {
    return 'name phải có từ 1 đến 100 ký tự';
  }
  if (slug !== undefined && (typeof slug !== 'string' || !slug.trim() || slug.trim().length > 120)) {
    return 'slug phải có từ 1 đến 120 ký tự';
  }
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return 'description phải là chuỗi ký tự';
  }
  if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== 'string') {
    return 'imageUrl phải là chuỗi ký tự';
  }
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return 'status phải là ACTIVE hoặc INACTIVE';
  }
  return null;
};

const handleError = (res, error, action) => {
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'Tên hoặc slug category đã tồn tại' });
  }
  console.error(`${action} category error:`, error);
  return res.status(500).json({ message: 'Lỗi máy chủ' });
};

const getAll = async (req, res) => {
  try {
    return res.json({ data: await CategoryModel.findAll() });
  } catch (error) {
    return handleError(res, error, 'Get all');
  }
};

const getOne = async (req, res) => {
  const id = getId(req.params.id);
  if (!id) return res.status(400).json({ message: 'id category không hợp lệ' });

  try {
    const category = await CategoryModel.findById(id);
    if (!category) return res.status(404).json({ message: 'Không tìm thấy category' });
    return res.json({ data: category });
  } catch (error) {
    return handleError(res, error, 'Get one');
  }
};

const create = async (req, res) => {
  const validationError = validateCategory(req.body);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const { name, slug, description, imageUrl, status = 'ACTIVE' } = req.body;
    const id = await CategoryModel.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description,
      imageUrl,
      status,
    });
    return res.status(201).json({
      message: 'Tạo category thành công',
      data: await CategoryModel.findById(id),
    });
  } catch (error) {
    return handleError(res, error, 'Create');
  }
};

const update = async (req, res) => {
  const id = getId(req.params.id);
  if (!id) return res.status(400).json({ message: 'id category không hợp lệ' });

  const validationError = validateCategory(req.body, true);
  if (validationError) return res.status(400).json({ message: validationError });

  try {
    const current = await CategoryModel.findById(id);
    if (!current) return res.status(404).json({ message: 'Không tìm thấy category' });

    await CategoryModel.update(id, {
      name: req.body.name?.trim() || current.name,
      slug: req.body.slug?.trim().toLowerCase() || current.slug,
      description: req.body.description ?? current.description,
      imageUrl: req.body.imageUrl ?? current.image_url,
      status: req.body.status || current.status,
    });
    return res.json({
      message: 'Cập nhật category thành công',
      data: await CategoryModel.findById(id),
    });
  } catch (error) {
    return handleError(res, error, 'Update');
  }
};

const remove = async (req, res) => {
  const id = getId(req.params.id);
  if (!id) return res.status(400).json({ message: 'id category không hợp lệ' });

  try {
    const affectedRows = await CategoryModel.remove(id);
    if (!affectedRows) return res.status(404).json({ message: 'Không tìm thấy category' });
    return res.json({ message: 'Xóa category thành công' });
  } catch (error) {
    return handleError(res, error, 'Delete');
  }
};

module.exports = { getAll, getOne, create, update, remove };
