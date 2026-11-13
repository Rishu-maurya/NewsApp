const express = require("express")
const router = express.Router()

const {
    createArticle,
    getArticles,
    getMyArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    getReviewQueue,
    reviewArticle,
} = require("../controllers/article.controller");
const authMiddleware = require("../middlewares/auth.middleware")
const optionalAuth = require("../middlewares/optionalauth.middleware");
const roleCheck = require("../middlewares/rolecheck.middleware");

const authors = roleCheck("journalist", "publisher");
const editors = roleCheck("editor", "admin");

router.get("/", optionalAuth, getArticles);
router.get("/mine", authMiddleware, authors, getMyArticles);
// "/review" must stay above "/:id", or "review" would be read as an article id
router.get("/review", authMiddleware, editors, getReviewQueue);
router.patch("/:id/review", authMiddleware, editors, reviewArticle);
router.get("/:id", optionalAuth, getArticleById);
router.post("/", authMiddleware, authors, createArticle);
router.put("/:id", authMiddleware, authors, updateArticle);
router.delete("/:id", authMiddleware, authors, deleteArticle);

module.exports = router;