const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js");
const optionalAuth = require("../middlewares/optionalauth.middleware.js");
// const adminOnly = require("../middlewares/admin.middleware.js");
const {
    getComments,
    createComment,
    deleteComment,
    moderateComment,
} = require("../controllers/comment.controller.js");

// Public read (logged-in users/admins get extra visibility)
router.get("/articles/:articleId/comments", optionalAuth, getComments);

// Logged-in users
router.post("/articles/:articleId/comments", authMiddleware, createComment);
router.delete("/comments/:id", authMiddleware, deleteComment);

// Admin only
// router.patch("/comments/:id/moderate", authMiddleware, adminOnly, moderateComment);

module.exports = router;
