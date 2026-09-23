const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Yêu cầu đăng nhập' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub), email: payload.email, role: payload.role };
    if (!req.user.id) return res.status(401).json({ message: 'Token không hợp lệ' });
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Yêu cầu đăng nhập' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Không có quyền truy cập' });
  return next();
};

module.exports = { authenticate, authorize };
