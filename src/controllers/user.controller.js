const prisma = require("../config/db");
const bcrypt = require("bcryptjs");

// ================= GET ALL USERS (admin + pagination) =================
exports.getUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.user.count();

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ================= GET USER BY ID =================
exports.getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบผู้ใช้",
      });
    }

    if (req.user.id !== user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "ไม่มีสิทธิ์",
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE USER =================
exports.updateUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (req.user.id !== id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "ไม่มีสิทธิ์",
      });
    }

    const data = { ...req.body };

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// ================= DELETE USER (admin) =================
exports.deleteUser = async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({
      success: true,
      message: "ลบผู้ใช้สำเร็จ",
    });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE STATUS (admin) =================
exports.updateStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { is_active: req.body.is_active }, 
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};