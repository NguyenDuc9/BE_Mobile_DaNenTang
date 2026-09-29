const Voucher = require('../models/voucher.model');
const valid = (d) => {
  if (!d.code || !['PERCENT', 'FIXED'].includes(d.type)) return 'code và type không hợp lệ';
  if (!Number.isFinite(Number(d.value)) || Number(d.value) <= 0 || (d.type === 'PERCENT' && Number(d.value) > 100)) return 'value không hợp lệ';
  if (!d.start_at || !d.end_at || new Date(d.end_at) < new Date(d.start_at)) return 'Thời hạn không hợp lệ';
  if (Number(d.min_order_amount || 0) < 0 || (d.max_discount_amount != null && Number(d.max_discount_amount) < 0)) return 'Giá trị đơn hàng không hợp lệ';
  return null;
};
const error = (res, e) => { console.error('Voucher error:', e); return res.status(e.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ message: e.code === 'ER_DUP_ENTRY' ? 'Mã voucher đã tồn tại' : 'Lỗi máy chủ' }); };
const available = async (req, res) => { try { return res.json({ data: await Voucher.list(true) }); } catch (e) { return error(res, e); } };
const find = async (req, res) => { try { const v = await Voucher.findByCode(req.params.code); if (!v) return res.status(404).json({ message: 'Voucher không tồn tại' }); return res.json({ data: v }); } catch (e) { return error(res, e); } };
const list = async (req, res) => { try { return res.json({ data: await Voucher.list(false) }); } catch (e) { return error(res, e); } };
const create = async (req, res) => { const message = valid(req.body); if (message) return res.status(400).json({ message }); try { const id = await Voucher.create(req.body); return res.status(201).json({ data: { id } }); } catch (e) { return error(res, e); } };
const update = async (req, res) => { const message = valid(req.body); if (message) return res.status(400).json({ message }); try { if (!(await Voucher.update(req.params.id, req.body))) return res.status(404).json({ message: 'Voucher không tồn tại' }); return res.json({ message: 'Cập nhật thành công' }); } catch (e) { return error(res, e); } };
const status = async (req, res) => { if (!['ACTIVE', 'INACTIVE'].includes(req.body.status)) return res.status(400).json({ message: 'status không hợp lệ' }); try { if (!(await Voucher.setStatus(req.params.id, req.body.status))) return res.status(404).json({ message: 'Voucher không tồn tại' }); return res.json({ message: 'Cập nhật thành công' }); } catch (e) { return error(res, e); } };
module.exports = { available, find, list, create, update, status };
