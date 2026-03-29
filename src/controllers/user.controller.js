const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const { messages, errors } = require("../utils/messages");
const userService = require("../services/user.service");
const audit = require("../utils/audit");

const getIP = (req) => req.headers["x-forwarded-for"] || req.ip;

const safeAudit = (data) => {
  try {
    audit.log(data);
  } catch (e) {
    console.error("audit failed:", e.message);
  }
};

// ================= GET USERS (ADMIN ONLY) =================
exports.getUsers = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: errors.FORBIDDEN,
        timestamp: new Date().toISOString(),
      });
    }

    const page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;

    if (limit > 100) limit = 100;
    if (limit < 1) limit = 10;

    const search = req.query.search;
    const role = req.query.role;
    const sort = req.query.sort || "created_at";
    const order = req.query.order === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    const allowedSort = ["created_at", "name", "email"];
    const sortField = allowedSort.includes(sort) ? sort : "created_at";

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, totalItems] = await Promise.all([
      userService.getUsers({
        skip,
        limit,
        where,
        orderBy: { [sortField]: order },
      }),
      userService.countUsers(where),
    ]);

    // ✅ audit admin action
    safeAudit({
      userId: req.user.id,
      action: "ADMIN_VIEW_USERS",
      ip: getIP(req),
    });

    return res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit),
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

    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: errors.FORBIDDEN,
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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

    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: errors.FORBIDDEN,
        timestamp: new Date().toISOString(),
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: errors.NOT_FOUND,
        timestamp: new Date().toISOString(),
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
            { field: "name", message: "ชื่อต้องมีความยาว 2-100 ตัวอักษร" },
          ],
          timestamp: new Date().toISOString(),
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
            { field: "password", message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" },
          ],
          timestamp: new Date().toISOString(),
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

    // ✅ audit
    safeAudit({
      userId: req.user.id,
      action:
        req.user.role === "admin"
          ? "ADMIN_UPDATE_USER"
          : "USER_UPDATE_PROFILE",
      ip: getIP(req),
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

// ================= DELETE USER =================
exports.deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: errors.FORBIDDEN,
        timestamp: new Date().toISOString(),
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errors.NOT_FOUND,
        timestamp: new Date().toISOString(),
      });
    }

    await prisma.user.delete({ where: { id } });

    // ✅ audit
    safeAudit({
      userId: req.user.id,
      action: "ADMIN_DELETE_USER",
      ip: getIP(req),
    });

    return res.json({
      success: true,
      message: messages.DELETED,
    });

  } catch (err) {
    next(err);
  }
};

// ================= UPDATE STATUS =================
exports.updateStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: errors.FORBIDDEN,
        timestamp: new Date().toISOString(),
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: errors.NOT_FOUND,
        timestamp: new Date().toISOString(),
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

    // ✅ audit
    safeAudit({
      userId: req.user.id,
      action: "ADMIN_TOGGLE_USER_STATUS",
      ip: getIP(req),
    });

    return res.json({
      success: true,
      message: messages.UPDATED,
      data: updated,
    });

  } catch (err) {
    next(err);
  }
};