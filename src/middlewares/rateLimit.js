const rateLimit = require("express-rate-limit");

// limiter สำหรับทั้งระบบ
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// limiter สำหรับ login
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณาลองใหม่ภายหลัง",
    timestamp: new Date().toISOString(),
  },
});

module.exports = {
  apiLimiter,
  loginLimiter,
};