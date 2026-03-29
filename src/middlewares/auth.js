const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { errors } = require('../utils/messages');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  //  ไม่มี token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: errors.UNAUTHORIZED,
      timestamp: new Date().toISOString(),
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    //  check blacklist
    const blacklisted = await prisma.blacklistToken.findUnique({
      where: { token },
    });

    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_TOKEN,
        timestamp: new Date().toISOString(),
      });
    }

    //  verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  check type
    if (decoded.type !== "access") {
      return res.status(401).json({
        success: false,
        message: errors.INVALID_TOKEN_TYPE,
        timestamp: new Date().toISOString(),
      });
    }

    //  ดึง user จาก DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    // 🔥 check user + status
    if (!user || !user.is_active) {
      return res.status(403).json({
        success: false,
        message: errors.ACCOUNT_DISABLED,
        timestamp: new Date().toISOString(),
      });
    }

    //  attach user (หลังเช็คแล้ว)
    req.user = {
      id: user.id,
      role: user.role,
    };

    next();

  } catch (err) {
    //  token expired
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: errors.TOKEN_EXPIRED,
        timestamp: new Date().toISOString(),
      });
    }

    //  token invalid
    return res.status(401).json({
      success: false,
      message: errors.INVALID_TOKEN,
      timestamp: new Date().toISOString(),
    });
  }
};