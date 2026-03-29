const prisma = require("../config/prisma");

exports.log = async ({ userId = null, action, ip = null }) => {
  try {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        ip_address: ip,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};