const Like = require("../models/like.js");
const Article = require("../models/article.js");

// ---------- helpers ----------
const isOwnerOrAdmin = (article, user) => {
    if (!user) return false;
    return user.role === "admin" || article.author.toString() === user._id.toString();
};

// ---------- 1) TOGGLE LIKE ----------
// POST /api/articles/:articleId/like
const toggleLike = async (req, res) => {
    try {
        const { articleId } = req.params;
        const userId = req.user._id;

        // Try to remove an existing like first, so a user can always unlike,
        // even if the article was unpublished or removed afterwards
        const removed = await Like.findOneAndDelete({ article: articleId, user: userId });

        if (removed) {
            const likeCount = await Like.countDocuments({ article: articleId });
            return res.status(200).json({
                success: true,
                message: "Article unliked",
                data: { liked: false, likeCount },
            });
        }

        // No existing like, so this is a new like: the article must be published
        const article = await Article.findById(articleId);
        if (!article || article.status !== "published") {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        try {
            await Like.create({ article: article._id, user: userId });
        } catch (error) {
            // Two simultaneous requests: the unique index blocks the second one.
            // The article is already liked, so treat it as success.
            if (error.code !== 11000) throw error;
        }

        const likeCount = await Like.countDocuments({ article: article._id });

        res.status(201).json({
            success: true,
            message: "Article liked",
            data: { liked: true, likeCount },
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Toggle Like Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) GET LIKE COUNT ----------
// GET /api/articles/:articleId/likes
const getLikeCount = async (req, res) => {
    try {
        const { articleId } = req.params;

        const article = await Article.findById(articleId);

        // Drafts are visible only to their author and admins
        if (!article || (article.status !== "published" && !isOwnerOrAdmin(article, req.user))) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        const likeCount = await Like.countDocuments({ article: article._id });

        const data = { likeCount };

        // If the caller is logged in, also say whether they liked this article
        if (req.user) {
            const myLike = await Like.exists({ article: article._id, user: req.user._id });
            data.liked = !!myLike;
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        console.error("Get Like Count Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { toggleLike, getLikeCount };