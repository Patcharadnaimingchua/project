const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const adminController = require("../controllers/admin.controller");

// ต้อง login + เป็น admin
router.get("/audit-logs", authMiddleware, adminController.getAuditLogs);

module.exports = router;