const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { messages, errors } = require('../utils/messages');
const { validateRegister } = require('../utils/validate');

// ================= REGISTER =================
exports.register = async (req, res) => {
  const validationErrors = validateRegister(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.VALIDATION_FAILED,
      errors: validationErrors
    });
  }

  const { name, email, password, role } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว'
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        role: role === 'admin' ? 'admin' : 'user'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return res.status(201).json({
      success: true,
      message: messages.CREATED,
      data: user
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: errors.SERVER_ERROR
    });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const validationErrors = [];

  if (!email) {
    validationErrors.push({ field: 'email', message: 'กรุณากรอกอีเมล' });
  }

  if (!password) {
    validationErrors.push({ field: 'password', message: 'กรุณากรอกรหัสผ่าน' });
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.VALIDATION_FAILED,
      errors: validationErrors
    });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_CREDENTIALS
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'บัญชีถูกปิดการใช้งาน'
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_CREDENTIALS
      });
    }

    // token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken }
    });

    return res.json({
      success: true,
      message: messages.LOGIN_SUCCESS,
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: errors.SERVER_ERROR
    });
  }
};

// ================= ME =================
exports.me = async (req, res) => {
  return res.json({
    success: true,
    message: 'ดึงข้อมูลผู้ใช้สำเร็จ',
    data: req.user
  });
};

// ================= REFRESH =================
exports.refresh = async (req, res) => {
  let { refreshToken } = req.body;

  if (refreshToken) refreshToken = refreshToken.trim();

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'ไม่มี refresh token'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.refresh_token) {
      return res.status(401).json({
        success: false,
        message: 'refresh token ไม่ถูกต้อง'
      });
    }

    if (user.refresh_token.trim() !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'refresh token ไม่ตรงกับระบบ'
      });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: newRefreshToken }
    });

    return res.json({
      success: true,
      message: 'ออก access token ใหม่สำเร็จ',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: 'refresh token ไม่ถูกต้อง'
    });
  }
};

// ================= LOGOUT =================
exports.logout = async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refresh_token: null }
    });

    return res.json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: errors.SERVER_ERROR
    });
  }
};