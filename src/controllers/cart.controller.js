const CartModel = require('../models/cart.model');
const db = require('../common/common');

const sendError = (res, error) => {
  console.error('Cart error:', error);
  if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(409).json({ message: 'Dữ liệu giỏ hàng không hợp lệ' });
  return res.status(500).json({ message: 'Lỗi máy chủ' });
};
const get = async (req, res) => { try { return res.json({ data: await CartModel.findWithItems(req.user.id) }); } catch (e) { return sendError(res, e); } };
const add = async (req, res) => {
  const quantity = Number(req.body.quantity);
  const variantId = Number(req.body.product_variant_id);
  if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ message: 'product_variant_id và quantity không hợp lệ' });
  try {
    const [rows] = await db.promise().execute(`SELECT pv.id FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE pv.id = ? AND pv.status = 'ACTIVE' AND p.status = 'ACTIVE'`, [variantId]);
    if (!rows[0]) return res.status(404).json({ message: 'Variant không tồn tại hoặc không hoạt động' });
    return res.status(201).json({ data: await CartModel.addItem(req.user.id, variantId, quantity) });
  } catch (e) { return sendError(res, e); }
};
const update = async (req, res) => {
  const quantity = Number(req.body.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ message: 'quantity phải lớn hơn 0' });
  try { if (!(await CartModel.updateItem(req.user.id, req.params.id, quantity))) return res.status(404).json({ message: 'Cart item không tồn tại' }); return res.json({ data: await CartModel.findWithItems(req.user.id) }); } catch (e) { return sendError(res, e); }
};
const remove = async (req, res) => { try { if (!(await CartModel.removeItem(req.user.id, req.params.id))) return res.status(404).json({ message: 'Cart item không tồn tại' }); return res.status(204).send(); } catch (e) { return sendError(res, e); } };
const clear = async (req, res) => { try { await CartModel.clear(req.user.id); return res.status(204).send(); } catch (e) { return sendError(res, e); } };
module.exports = { get, add, update, remove, clear };
