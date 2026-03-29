const prisma = require("../config/prisma");

// ================= GET AUDIT LOGS (ADMIN ONLY) =================
exports.getAuditLogs = async (req, res, next) => {
  try {
    // admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    const page = Number(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const logs = await prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    const total = await prisma.auditLog.count();

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};