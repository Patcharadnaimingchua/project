const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: ระบบยืนยันตัวตน
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: สมัครสมาชิก
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             name: "John Doe"
 *             email: "john@example.com"
 *             password: "12345678"
 *             role: "user"
 *     responses:
 *       201:
 *         description: สมัครสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             email: "john@example.com"
 *             password: "12345678"
 *     responses:
 *       200:
 *         description: เข้าสำเร็จ
 *       401:
 *         description: ข้อมูลไม่ถูกต้อง
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: ออกจากระบบ
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ออกจากระบบสำเร็จ
 *       401:
 *         description: ไม่มีสิทธิ์
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: ดูข้อมูลผู้ใช้ปัจจุบัน
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       401:
 *         description: ไม่มีสิทธิ์
 */
router.get("/me", authMiddleware, authController.me);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: ต่ออายุ access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             refreshToken: "your-refresh-token"
 *     responses:
 *       200:
 *         description: ได้ access token ใหม่
 *       401:
 *         description: refresh token ไม่ถูกต้อง
 */
router.post("/refresh", authController.refresh);

module.exports = router;