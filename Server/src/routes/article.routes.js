const express = require("express")
const router = express.Router()

const {
    createArticle,
    getArticles,
    getMyArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    getReviewQueue
} = require("../controllers/article.controller");
const authMiddleware = require("../middlewares/auth.middleware")
const optionalAuth = require("../middlewares/optionalauth.middleware");
const roleCheck = require("../middlewares/rolecheck.middleware");
const { getReviews, createReview, publishArticle } = require("../controllers/review.controller");

const authors = roleCheck("journalist", "publisher");
const editors = roleCheck("editor", "admin");

router.get("/", optionalAuth, getArticles);
router.get("/mine", authMiddleware, authors, getMyArticles);
router.get("/:id", optionalAuth, getArticleById);
router.post("/", authMiddleware, authors, createArticle);
router.put("/:id", authMiddleware, authors, updateArticle);
router.delete("/:id", authMiddleware, authors, deleteArticle);
router.get("/review-queue", authMiddleware, editors, getReviewQueue);
router.get("/:articleId/reviews", authMiddleware, getReviews);
router.post("/:articleId/reviews", authMiddleware, editors, createReview);
router.patch("/:articleId/publish", authMiddleware, editors, publishArticle);

module.exports = router;