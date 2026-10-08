const Model = require('../models/build-template.model');
const TYPES = ['CPU', 'MAINBOARD', 'RAM', 'GPU', 'STORAGE', 'PSU', 'CASE', 'COOLER'];
const error = (res, e) => res.status(e.status || (e.code === 'ER_DUP_ENTRY' ? 409 : 500)).json({ message: e.status ? e.message : 'Lỗi máy chủ' });
const valid = (d = {}) => {
  if (!d || typeof d !== 'object' || Array.isArray(d) ||
      typeof d.name !== 'string' || !d.name.trim() || d.name.trim().length > 150 ||
      !Array.isArray(d.items) || !d.items.length) {
    return 'Tên cấu hình (tối đa 150 ký tự) và danh sách linh kiện là bắt buộc';
  }
  if (d.items.some((i) =>
    !i ||
    !TYPES.includes(i.componentType) ||
    !Number.isSafeInteger(Number(i.productId)) ||
    Number(i.productId) <= 0 ||
    !Number.isSafeInteger(Number(i.productVariantId)) ||
    Number(i.productVariantId) <= 0 ||
    !Number.isSafeInteger(Number(i.quantity)) ||
    Number(i.quantity) <= 0 ||
    Number(i.quantity) > 4294967295
  )) return 'Linh kiện, biến thể hoặc số lượng không hợp lệ';
  if (new Set(d.items.map((i) => i.componentType)).size !== d.items.length) return 'Không được trùng component_type';
  return null;
};
const list = async (req, res) => { try { res.json({ data: await Model.list(req.user.role !== 'customer') }); } catch (e) { error(res, e); } };
const find = async (req, res) => { try { const d = await Model.find(req.params.id); if (!d) return res.status(404).json({ message: 'Template không tồn tại' }); res.json({ data: d }); } catch (e) { error(res, e); } };
const components = async (_req, res) => { try { res.json({ data: await Model.listAvailableComponents() }); } catch (e) { error(res, e); } };
const save = async (req, res) => { const m = valid(req.body); if (m) return res.status(400).json({ message: m }); try { const checked = await Model.validateItems(req.body.items); if (checked.error) return res.status(400).json({ message: checked.error }); const items = checked.items; const estimatedTotal = items.reduce((s, i) => s + i.unitPrice * Number(i.quantity), 0); const id = await Model.save({ ...req.body, items, estimatedTotal }, req.params.id); if (!id) return res.status(404).json({ message: 'Template không tồn tại' }); res.status(req.params.id ? 200 : 201).json({ data: { id } }); } catch (e) { error(res, e); } };
const remove = async (req, res) => {
  try {
    if (!(await Model.delete(req.params.id))) {
      return res.status(404).json({ message: 'Template không tồn tại' });
    }
    return res.status(204).end();
  } catch (e) {
    return error(res, e);
  }
};
const status = async (req, res) => {
  if (!['ACTIVE', 'INACTIVE'].includes(req.body.status)) return res.status(400).json({ message: 'status không hợp lệ' });
  try {
    if (req.body.status === 'ACTIVE') {
      const template = await Model.find(req.params.id);
      if (!template) return res.status(404).json({ message: 'Template không tồn tại' });
      if (['CPU', 'MAINBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE'].some((type) => !template.items.some((item) => item.component_type === type))) {
        return res.status(400).json({ message: 'Template thiếu thành phần bắt buộc' });
      }
    }
    if (!(await Model.setStatus(req.params.id, req.body.status))) return res.status(404).json({ message: 'Template không tồn tại' });
    res.json({ message: 'Cập nhật thành công' });
  } catch (e) { error(res, e); }
};
module.exports = { list, find, components, save, remove, status };
