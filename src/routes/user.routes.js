const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

// admin เท่านั้น
router.get("/", auth, role(["admin"]), userController.getUsers);

// owner หรือ admin
router.get("/:id", auth, userController.getUserById);
router.put("/:id", auth, userController.updateUser);

// admin เท่านั้น
router.delete("/:id", auth, role(["admin"]), userController.deleteUser);
router.patch("/:id/status", auth, role(["admin"]), userController.updateStatus);

module.exports = router;