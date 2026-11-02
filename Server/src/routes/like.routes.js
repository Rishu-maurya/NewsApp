const express = require("express");
const router = express.Router();
 
const authMiddleware = require("../middlewares/auth.middleware.js"); 
const optionalAuth = require("../middlewares/optionalauth.middleware.js");
const { toggleLike, getLikeCount } = require("../controllers/like.controller.js");
 
// Logged-in users
router.post("/articles/:articleId/like", authMiddleware, toggleLike);
 
// Public (logged-in callers also get their own "liked" flag)
router.get("/articles/:articleId/likes", optionalAuth, getLikeCount);
 
module.exports = router;