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
const create = async (req, res) => {
  const message = valid(req.body);
  if (message) return res.status(400).json({ message });
  try { return res.status(201).json({ data: { id: await Voucher.create(req.body) } }); } catch (e) { return error(res, e); }
};
const update = async (req, res) => { const message = valid(req.body); if (message) return res.status(400).json({ message }); try { if (!(await Voucher.update(req.params.id, req.body))) return res.status(404).json({ message: 'Voucher không tồn tại' }); return res.json({ message: 'Cập nhật thành công' }); } catch (e) { return error(res, e); } };
const status = async (req, res) => { if (!['ACTIVE', 'INACTIVE'].includes(req.body.status)) return res.status(400).json({ message: 'status không hợp lệ' }); try { if (!(await Voucher.setStatus(req.params.id, req.body.status))) return res.status(404).json({ message: 'Voucher không tồn tại' }); return res.json({ message: 'Cập nhật thành công' }); } catch (e) { return error(res, e); } };

/**
 * POST /vouchers/validate
 * body: { code: string, subtotal: number }
 * Trả về shape tương thích với mobile VoucherValidation:
 *   { valid: true, voucher: {...} } | { valid: false, error: string, minOrder?: number }
 */
const validate = async (req, res) => {
  const code = (req.body && req.body.code ? req.body.code : '').toString().trim();
  const subtotal = Number(req.body && req.body.subtotal);
  if (!code) {
    return res.status(400).json({ valid: false, error: 'Vui lòng nhập mã voucher.' });
  }
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return res.status(400).json({ valid: false, error: 'Giá trị đơn hàng không hợp lệ.' });
  }
  try {
    const voucher = await Voucher.findByCode(code);
    if (!voucher) {
      return res.status(200).json({ valid: false, error: 'Voucher không tồn tại.' });
    }
    if (voucher.status !== 'ACTIVE') {
      return res.status(200).json({ valid: false, error: 'Voucher đã bị vô hiệu hóa.' });
    }
    const now = new Date();
    const start = new Date(voucher.start_at);
    const end = new Date(voucher.end_at);
    if (start > now || end <= now) {
      return res.status(200).json({ valid: false, error: 'Voucher hết hạn hoặc chưa bắt đầu.' });
    }
    if (voucher.usage_limit !== null && Number(voucher.used_count) >= Number(voucher.usage_limit)) {
      return res.status(200).json({ valid: false, error: 'Voucher đã hết lượt sử dụng.' });
    }
    const minOrder = Number(voucher.min_order_value || 0);
    if (subtotal < minOrder) {
      return res.status(200).json({
        valid: false,
        error: `Đơn hàng cần tối thiểu ${minOrder.toLocaleString('vi-VN')}đ để áp dụng.`,
        minOrder,
      });
    }
    let discountPreview =
      voucher.discount_type === 'PERCENT'
        ? (subtotal * Number(voucher.discount_value)) / 100
        : Number(voucher.discount_value);
    if (voucher.max_discount !== null) {
      discountPreview = Math.min(discountPreview, Number(voucher.max_discount));
    }
    discountPreview = Math.max(0, Math.min(discountPreview, subtotal));
    return res.json({
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        name: voucher.name || voucher.code,
        description: voucher.description,
        discountType: voucher.discount_type,
        discountValue: Number(voucher.discount_value),
        discountPreview,
        minOrder,
        maxDiscount: voucher.max_discount !== null ? Number(voucher.max_discount) : null,
        usageLimit: voucher.usage_limit !== null ? Number(voucher.usage_limit) : null,
        usedCount: Number(voucher.used_count || 0),
        remaining:
          voucher.usage_limit !== null
            ? Math.max(0, Number(voucher.usage_limit) - Number(voucher.used_count || 0))
            : null,
      },
    });
  } catch (e) {
    console.error('Voucher validate error:', e);
    return res.status(500).json({ valid: false, error: 'Không kiểm tra được voucher.' });
  }
};

module.exports = { available, find, list, create, update, status, validate };