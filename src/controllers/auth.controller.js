const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const audit = require("../utils/audit");
const { messages, errors } = require('../utils/messages');
const { validateRegister } = require('../utils/validate');

const getIP = (req) => req.headers["x-forwarded-for"] || req.ip;

const safeAudit = (data) => {
  try {
    audit.log(data);
  } catch (e) {
    console.error("audit failed:", e.message);
  }
};

// ================= REGISTER =================
exports.register = async (req, res, next) => {
  try {
    const validationErrors = validateRegister(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.VALIDATION_FAILED,
        errors: validationErrors,
        timestamp: new Date().toISOString(),
      });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: errors.EMAIL_ALREADY_EXISTS,
        timestamp: new Date().toISOString(),
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        role: 'user'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    safeAudit({
      userId: user.id,
      action: "USER_REGISTER",
      ip: getIP(req),
    });

    return res.status(201).json({
      success: true,
      message: messages.CREATED,
      data: user
    });

  } catch (err) {
    next(err);
  }
};

// ================= LOGIN =================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const errorsArr = [];
    if (!email) errorsArr.push({ field: 'email', message: 'กรุณากรอกอีเมล' });
    if (!password) errorsArr.push({ field: 'password', message: 'กรุณากรอกรหัสผ่าน' });

    if (errorsArr.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors.VALIDATION_FAILED,
        errors: errorsArr,
        timestamp: new Date().toISOString(),
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      safeAudit({
        userId: null,
        action: "LOGIN_FAILED",
        ip: getIP(req),
      });

      return res.status(401).json({
        success: false,
        message: errors.INVALID_CREDENTIALS,
        timestamp: new Date().toISOString(),
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: errors.ACCOUNT_DISABLED,
        timestamp: new Date().toISOString(),
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      safeAudit({
        userId: user.id,
        action: "LOGIN_FAILED",
        ip: getIP(req),
      });

      return res.status(401).json({
        success: false,
        message: errors.INVALID_CREDENTIALS,
        timestamp: new Date().toISOString(),
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, role: user.role, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role, type: "refresh" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: refreshToken }
    });

    safeAudit({
      userId: user.id,
      action: "USER_LOGIN",
      ip: getIP(req),
    });

    return res.json({
      success: true,
      message: messages.LOGIN_SUCCESS,
      accessToken,
      refreshToken
    });

  } catch (err) {
    next(err);
  }
};

// ================= ME =================
exports.me = async (req, res) => {
  return res.json({
    success: true,
    message: messages.FETCHED,
    data: req.user
  });
};

// ================= REFRESH =================
exports.refresh = async (req, res, next) => {
  try {
    let { refreshToken } = req.body;
    if (refreshToken) refreshToken = refreshToken.trim();

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: errors.MISSING_REFRESH_TOKEN,
        timestamp: new Date().toISOString(),
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_REFRESH_TOKEN,
        timestamp: new Date().toISOString(),
      });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_TOKEN_TYPE,
        timestamp: new Date().toISOString(),
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user || !user.refresh_token || user.refresh_token.trim() !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_REFRESH_TOKEN,
        timestamp: new Date().toISOString(),
      });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const newRefreshToken = jwt.sign(
      { id: user.id, role: user.role, type: "refresh" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refresh_token: newRefreshToken }
    });

    safeAudit({
      userId: user.id,
      action: "REFRESH_TOKEN",
      ip: getIP(req),
    });

    return res.json({
      success: true,
      message: messages.REFRESH_SUCCESS,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (err) {
    next(err);
  }
};

// ================= LOGOUT =================
exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: errors.UNAUTHORIZED,
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_TOKEN,
        timestamp: new Date().toISOString(),
      });
    }

    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_TOKEN_TYPE,
        timestamp: new Date().toISOString(),
      });
    }

    const existing = await prisma.blacklistToken.findUnique({
      where: { token },
    });

    if (!existing) {
      await prisma.blacklistToken.create({
        data: {
          token,
          expired_at: new Date(decoded.exp * 1000),
        },
      });
    }

    await prisma.user.update({
      where: { id: decoded.id },
      data: { refresh_token: null },
    });

    safeAudit({
      userId: decoded.id,
      action: "USER_LOGOUT",
      ip: getIP(req),
    });

    return res.json({
      success: true,
      message: messages.LOGOUT_SUCCESS,
    });

  } catch (err) {
    next(err);
  }
};