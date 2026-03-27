const prisma = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validateRegister } = require("../utils/validate");

// ================= REGISTER =================
exports.register = async (req, res, next) => {
  try {
    // ✅ validate input
    const errors = validateRegister(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้อง",
        errors,
        timestamp: new Date().toISOString(),
      });
    }

    const { name, email, password } = req.body;

    // ✅ check email ซ้ำ
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "อีเมลนี้ถูกใช้งานแล้ว",
      });
    }

    // ✅ hash password
    const hash = await bcrypt.hash(password, 10);

    // ✅ create user
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hash,
        role: "ADMIN",
        is_active: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "สมัครสมาชิกสำเร็จ",
    });
  } catch (err) {
    next(err);
  }
};

// ================= LOGIN =================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ✅ check input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอก email และ password",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "ไม่พบอีเมล",
      });
    }

    // ✅ check active
    if (user.is_active === false){
      return res.status(403).json({
        success: false,
        message: "บัญชีถูกปิดการใช้งาน",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "รหัสผ่านไม่ถูกต้อง",
      });
    }

    // ✅ create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      token,
    });
  } catch (err) {
    next(err);
  }
};

// ================= ME =================
exports.me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};