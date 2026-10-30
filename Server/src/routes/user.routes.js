const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js");
const adminOnly = require("../middlewares/admin.middleware.js");
const {
    getUsers,
    getUserById,
    updateProfile,
    updateUserRole,
    updateUserStatus,
} = require("../controllers/user.controller.js");

// Every user route needs a logged-in, active user
router.use(authMiddleware);

// Any logged-in user
// NOTE: "/profile" must be declared before "/:id" routes
router.put("/profile", updateProfile);

// Admin only
router.get("/", adminOnly, getUsers);
router.patch("/:id/role", adminOnly, updateUserRole);
router.patch("/:id/status", adminOnly, updateUserStatus);

// Admin, or the user themselves (checked inside the controller)
router.get("/:id", getUserById);

module.exports = router;
