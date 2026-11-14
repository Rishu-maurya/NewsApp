const express = require("express");
const {
	getUsers,
	updateProfile,
	updateUserRole,
	updateUserStatus,
} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/rolecheck.middleware");

const router = express.Router();
const adminOnly = roleCheck("admin");

router.get("/", authMiddleware, adminOnly, getUsers);
router.put("/profile", authMiddleware, updateProfile);
router.patch("/:id/role", authMiddleware, adminOnly, updateUserRole);
router.patch("/:id/status", authMiddleware, adminOnly, updateUserStatus);

module.exports = router;
