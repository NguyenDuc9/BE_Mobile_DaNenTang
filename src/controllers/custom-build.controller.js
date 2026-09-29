const Model = require('../models/custom-build.model');
const OrderService = require('../services/order.service');
const error = (res, e) => res.status(e.status || (e.code === 'ER_DUP_ENTRY' ? 409 : 500)).json({ message: e.status ? e.message : 'Lỗi máy chủ' });
const validItems = (items) => Array.isArray(items) && items.length && items.every((i) => Number.isInteger(Number(i.productVariantId)) && Number(i.productVariantId) > 0 && ['CPU', 'MAINBOARD', 'RAM', 'GPU', 'STORAGE', 'PSU', 'CASE', 'COOLER'].includes(i.componentType) && Number.isInteger(Number(i.quantity)) && Number(i.quantity) > 0);
const list = async (req, res) => { try { res.json({ data: await Model.list(req.user.id) }); } catch (e) { error(res, e); } };
const find = async (req, res) => { try { const d = await Model.find(req.params.id, req.user.id); if (!d) return res.status(404).json({ message: 'Build không tồn tại' }); res.json({ data: d }); } catch (e) { error(res, e); } };
const create = async (req, res) => { try { if (req.body.items && !validItems(req.body.items)) return res.status(400).json({ message: 'items không hợp lệ' }); const id = await Model.create(req.user.id, req.body); if (req.body.items) await Model.replaceItems(id, req.user.id, req.body.items); res.status(201).json({ data: { id } }); } catch (e) { error(res, e); } };
const items = async (req, res) => { if (!validItems(req.body.items)) return res.status(400).json({ message: 'items không hợp lệ' }); try { const total = await Model.replaceItems(req.params.id, req.user.id, req.body.items); if (total === null) return res.status(404).json({ message: 'Build không tồn tại' }); res.json({ data: { total } }); } catch (e) { error(res, e); } };
const addItem = async (req, res) => {
  try {
    const build = await Model.find(req.params.id, req.user.id);
    if (!build) return res.status(404).json({ message: 'Build không tồn tại' });
    const next = build.items.map((i) => ({ productVariantId: i.product_variant_id, componentType: i.component_type, quantity: i.quantity }));
    next.push(req.body);
    if (!validItems(next)) return res.status(400).json({ message: 'item không hợp lệ' });
    const total = await Model.replaceItems(req.params.id, req.user.id, next);
    res.status(201).json({ data: { total } });
  } catch (e) { error(res, e); }
};
const updateItem = async (req, res) => {
  try {
    const build = await Model.find(req.params.id, req.user.id);
    if (!build) return res.status(404).json({ message: 'Build không tồn tại' });
    const next = build.items.map((i) => ({ productVariantId: i.product_variant_id, componentType: i.component_type, quantity: i.id === Number(req.params.itemId) ? req.body.quantity : i.quantity }));
    if (!validItems(next)) return res.status(400).json({ message: 'item không hợp lệ' });
    await Model.replaceItems(req.params.id, req.user.id, next); res.json({ message: 'Cập nhật thành công' });
  } catch (e) { error(res, e); }
};
const deleteItem = async (req, res) => {
  try {
    const build = await Model.find(req.params.id, req.user.id);
    if (!build) return res.status(404).json({ message: 'Build không tồn tại' });
    const next = build.items.filter((i) => i.id !== Number(req.params.itemId)).map((i) => ({ productVariantId: i.product_variant_id, componentType: i.component_type, quantity: i.quantity }));
    if (!next.length) return res.status(400).json({ message: 'Build phải có item' });
    await Model.replaceItems(req.params.id, req.user.id, next); res.json({ message: 'Đã xóa item' });
  } catch (e) { error(res, e); }
};
const submit = async (req, res) => { try { const build = await Model.find(req.params.id, req.user.id); if (!build) return res.status(404).json({ message: 'Build không tồn tại' }); const required = ['CPU', 'MAINBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE']; if (required.some((t) => !build.items.some((i) => i.component_type === t))) return res.status(400).json({ message: 'Build thiếu thành phần bắt buộc' }); if (!(await Model.submit(req.params.id, req.user.id))) return res.status(409).json({ message: 'Build không ở trạng thái DRAFT' }); res.json({ message: 'Đã submit build' }); } catch (e) { error(res, e); } };
const checkout = async (req, res) => {
  try { return res.status(201).json({ data: await OrderService.checkoutCustom(req.user.id, req.params.id, req.body) }); }
  catch (e) { return error(res, e); }
};
module.exports = { list, find, create, items, addItem, updateItem, deleteItem, submit, checkout };
