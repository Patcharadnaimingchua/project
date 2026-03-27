const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const { messages, errors } = require("../utils/messages");

// ================= GET ALL USERS (ADMIN) =================
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
        created_at: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    const totalPages = Math.ceil(totalItems / limit);

    return res.json({
      success: true,
      message: messages.FETCHED,
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
    const id = Number(req.params.id);

    // 🔥 RBAC: admin หรือ owner เท่านั้น
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: errors.FORBIDDEN,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errors.NOT_FOUND,
      });
    }

    return res.json({
      success: true,
      message: messages.FETCHED,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE USER =================
exports.updateUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // 🔥 RBAC: admin หรือ owner
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: errors.FORBIDDEN,
      });
    }

    const { name, password } = req.body;

    const data = {};

    if (name) {
      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({
          success: false,
          message: errors.VALIDATION_FAILED,
          errors: [
            {
              field: "name",
              message: "ชื่อต้องมีความยาว 2-100 ตัวอักษร",
            },
          ],
        });
      }
      data.name = name.trim();
    }

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: errors.VALIDATION_FAILED,
          errors: [
            {
              field: "password",
              message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
            },
          ],
        });
      }

      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
      },
    });

    return res.json({
      success: true,
      message: messages.UPDATED,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// ================= DELETE USER (ADMIN) =================
exports.deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errors.NOT_FOUND,
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: messages.DELETED,
    });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE STATUS (ADMIN) =================
exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errors.NOT_FOUND,
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        is_active: !user.is_active,
      },
      select: {
        id: true,
        is_active: true,
      },
    });

    return res.json({
      success: true,
      message: "อัปเดตสถานะสำเร็จ",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};