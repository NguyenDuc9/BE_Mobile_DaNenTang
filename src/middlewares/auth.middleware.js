const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/auth.model');
const { authenticate, authorize } = require('./authorization.middleware');

const normalizeEmail = (email) => email.trim().toLowerCase();

const createToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
  );

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: 'fullName, email và password là bắt buộc' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await UserModel.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ message: 'Email đã được sử dụng' });
    }

    const role = await UserModel.findRoleByName('customer');
    if (!role) {
      return res
        .status(500)
        .json({ message: 'Chưa có role USER trong cơ sở dữ liệu' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = await UserModel.create({
      roleId: role.id,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone,
      passwordHash,
    });

    const user = await UserModel.findByEmail(normalizedEmail);
    return res.status(201).json({
      message: 'Đăng ký thành công',
      data: {
        id: userId,
        fullName: user.full_name,
        email: user.email,
        phone: phone || null,
        role: user.role_name,
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res
        .status(409)
        .json({ message: 'Email hoặc số điện thoại đã được sử dụng' });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email và password là bắt buộc' });
    }

    const user = await UserModel.findByEmail(normalizeEmail(email));
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res
        .status(401)
        .json({ message: 'Email hoặc mật khẩu không đúng' });
    }
    if (user.status !== 'ACTIVE') {
      return res
        .status(403)
        .json({ message: `Tài khoản đang ở trạng thái ${user.status}` });
    }

    return res.json({
      message: 'Đăng nhập thành công',
      data: {
        token: createToken(user),
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role_name,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const me = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    if (user.status !== 'ACTIVE') return res.status(403).json({ message: 'Tài khoản không hoạt động' });
    return res.json({ data: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, avatarUrl: user.avatar_url, role: user.role_name } });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = { register, login, me, authenticate, authorize };
