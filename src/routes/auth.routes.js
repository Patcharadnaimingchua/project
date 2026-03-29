const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth");
const { loginLimiter } = require("../middlewares/rateLimit");

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
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: abc12345
 *     responses:
 *       201:
 *         description: สมัครสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง (validation)
 *       409:
 *         description: อีเมลนี้ถูกใช้งานแล้ว
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
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: abc12345
 *     responses:
 *       200:
 *         description: เข้าสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง (เช่น ไม่กรอก email/password)
 *       401:
 *         description: อีเมลหรือรหัสผ่านไม่ถูกต้อง
 *       403:
 *         description: บัญชีถูกปิดการใช้งาน
 *       429:
 *         description: พยายามเข้าสู่ระบบบ่อยเกินไป (Rate limit)
 */
router.post("/login", loginLimiter, authController.login);

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
 *         description: ไม่มีสิทธิ์ (token ไม่ถูกต้อง หรือไม่ส่ง token)
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
 *         description: ไม่มีสิทธิ์ (token ไม่ถูกต้อง หรือไม่ส่ง token)
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
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: your-refresh-token
 *     responses:
 *       200:
 *         description: ได้ access token ใหม่
 *       400:
 *         description: ไม่มี refresh token
 *       401:
 *         description: refresh token ไม่ถูกต้อง / หมดอายุ / ไม่ตรงกับระบบ
 */
router.post("/refresh", authController.refresh);

module.exports = router;