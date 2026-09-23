const Model = require('../models/notification.model');
const error = (res, e) => res.status(500).json({ message: 'Lỗi máy chủ' });
const list = async (req, res) => { try { const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100); const page = Math.max(Number(req.query.page) || 1, 1); res.json({ data: await Model.list(req.user.id, limit, (page - 1) * limit), page, limit }); } catch (e) { error(res, e); } };
const unread = async (req, res) => { try { res.json({ data: { count: await Model.count(req.user.id) } }); } catch (e) { error(res, e); } };
const read = async (req, res) => { try { if (!(await Model.read(req.params.id, req.user.id))) return res.status(404).json({ message: 'Notification không tồn tại' }); res.json({ message: 'Đã đọc' }); } catch (e) { error(res, e); } };
const readAll = async (req, res) => { try { res.json({ data: { updated: await Model.readAll(req.user.id) } }); } catch (e) { error(res, e); } };
const remove = async (req, res) => { try { if (!(await Model.remove(req.params.id, req.user.id))) return res.status(404).json({ message: 'Notification không tồn tại' }); res.json({ message: 'Đã xóa' }); } catch (e) { error(res, e); } };
module.exports = { list, unread, read, readAll, remove };
