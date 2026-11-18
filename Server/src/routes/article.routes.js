const express = require("express")
const router = express.Router()

const {
    createArticle,
    getArticles,
    getMyArticles,
    getPublisherArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    getReviewQueue,
    getPublishQueue,
    returnArticleToReview,
} = require("../controllers/article.controller");
const authMiddleware = require("../middlewares/auth.middleware")
const optionalAuth = require("../middlewares/optionalauth.middleware");
const roleCheck = require("../middlewares/rolecheck.middleware");
const { getReviews, createReview, publishArticle } = require ("../controllers/review.controller")
const { toggleLike, getLikeCount } = require ("../controllers/like.controller")

const authors = roleCheck("journalist", "editor", "publisher");
const editors = roleCheck("editor", "admin");
const publishers = roleCheck("publisher", "admin");

router.get("/", optionalAuth, getArticles);
router.get("/mine", authMiddleware, authors, getMyArticles);
router.get("/review-queue", authMiddleware, editors, getReviewQueue);
router.get("/publish-queue", authMiddleware, publishers, getPublishQueue);
router.get("/publisher-all", authMiddleware, publishers, getPublisherArticles);
router.patch("/:articleId/return-to-review", authMiddleware, publishers, returnArticleToReview);
router.get("/:id", optionalAuth, getArticleById);
router.post("/", authMiddleware, authors, createArticle);
router.put("/:id", authMiddleware, authors, updateArticle);
router.delete("/:id", authMiddleware, roleCheck("journalist", "editor", "publisher", "admin"), deleteArticle);
router.get("/:articleId/reviews", authMiddleware, getReviews);
router.post("/:articleId/reviews", authMiddleware, editors, createReview);
router.patch("/:articleId/publish", authMiddleware, publishers, publishArticle);
router.post("/:articleId/like", authMiddleware,toggleLike);
router.get("/:articleId/likes",  authMiddleware, getLikeCount);

module.exports = router;