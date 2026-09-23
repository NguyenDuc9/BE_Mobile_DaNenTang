const bad = (res, message) => res.status(400).json({ message });
const positiveId = (field) => (req, res, next) => {
  const value = Number(req.params[field]);
  if (!Number.isInteger(value) || value <= 0) return bad(res, `${field} không hợp lệ`);
  req.params[field] = value;
  return next();
};
const required = (...fields) => (req, res, next) => {
  const missing = fields.find((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
  if (missing) return bad(res, `${missing} là bắt buộc`);
  return next();
};
module.exports = { positiveId, required };
