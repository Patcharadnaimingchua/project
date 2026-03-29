const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth");
const { errors } = require("../utils/messages");

// admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: errors.FORBIDDEN,
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: จัดการผู้ใช้งาน
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: ดึงรายการผู้ใช้ทั้งหมด (Admin เท่านั้น)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: john
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           example: admin
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           example: desc
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *       401:
 *         description: ไม่ได้ login หรือ token ไม่ถูกต้อง
 *       403:
 *         description: ไม่มีสิทธิ์ (ไม่ใช่ admin)
 */
router.get("/", authMiddleware, isAdmin, userController.getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้รายบุคคล (Admin หรือ Owner)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *       401:
 *         description: ไม่ได้ login หรือ token ไม่ถูกต้อง
 *       403:
 *         description: ไม่มีสิทธิ์ (ไม่ใช่เจ้าของหรือ admin / account ถูกปิด)
 *       404:
 *         description: ไม่พบผู้ใช้
 */
router.get("/:id", authMiddleware, userController.getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: อัปเดตข้อมูลผู้ใช้ (Admin หรือ Owner)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           example:
 *             name: "John Doe"
 *             password: "abc12345"
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง (validation failed)
 *       401:
 *         description: ไม่ได้ login หรือ token ไม่ถูกต้อง
 *       403:
 *         description: ไม่มีสิทธิ์ (ไม่ใช่เจ้าของหรือ admin / account ถูกปิด)
 *       404:
 *         description: ไม่พบผู้ใช้
 */
router.put("/:id", authMiddleware, userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: ลบผู้ใช้ (Admin เท่านั้น)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *       401:
 *         description: ไม่ได้ login หรือ token ไม่ถูกต้อง
 *       403:
 *         description: ไม่มีสิทธิ์ (ไม่ใช่ admin)
 *       404:
 *         description: ไม่พบผู้ใช้
 */
router.delete("/:id", authMiddleware, isAdmin, userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: เปิด/ปิดการใช้งานผู้ใช้ (Admin เท่านั้น)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: อัปเดตสถานะสำเร็จ
 *       401:
 *         description: ไม่ได้ login หรือ token ไม่ถูกต้อง
 *       403:
 *         description: ไม่มีสิทธิ์ (ไม่ใช่ admin หรือ account ถูกปิด)
 *       404:
 *         description: ไม่พบผู้ใช้
 */
router.patch("/:id/status", authMiddleware, isAdmin, userController.updateStatus);

module.exports = router;