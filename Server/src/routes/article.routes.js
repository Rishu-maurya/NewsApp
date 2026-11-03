const express = require("express")
const router = express.Router()

const {
    createArticle,
    getArticles,
    getMyArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
} = require("../controllers/article.controller");
const authMiddleware = require("../middlewares/auth.middleware")
const optionalAuth = require("../middlewares/optionalauth.middleware");
const roleCheck = require("../middlewares/rolecheck.middleware");

const authors = roleCheck("journalist", "publisher");

router.get("/", optionalAuth, getArticles);
router.get("/mine", authMiddleware, authors, getMyArticles);
router.get("/:id", optionalAuth, getArticleById);
router.post("/", authMiddleware, authors, createArticle);
router.put("/:id", authMiddleware, authors, updateArticle);
router.delete("/:id", authMiddleware, authors, deleteArticle);

module.exports = router;