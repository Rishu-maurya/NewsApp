const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const adminOnly = require("../middlewares/admin.middleware.js");

const router = express.Router();

const {
    getUsers,
    getUserById,
    updateProfile,
    updateUserRole,
    updateUserStatus,
} = require("../controllers/user.controller.js");

// Every user route needs a logged-in, active user
router.use(authMiddleware);


// Admin only
router.get("/", adminOnly, getUsers);
router.patch("/:id/role", adminOnly, updateUserRole);
router.patch("/:id/status", adminOnly, updateUserStatus);

// Admin, or the user themselves (checked inside the controller)
router.get("/:id", getUserById);


module.exports = router;
