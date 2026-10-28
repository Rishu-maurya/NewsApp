const Comment = require("../models/commemt.ja");
const Article = require("../models/article.js");

// ---------- helpers ----------
const isOwnerOrAdmin = (article, user) => {
    if (!user) return false;
    return user.role === "admin" || article.author.toString() === user._id.toString();
};

// ---------- 1) GET COMMENTS OF AN ARTICLE ----------
// GET /api/articles/:articleId/comments?page=1&limit=10
const getComments = async (req, res) => {
    try {
        const { articleId } = req.params;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

        const article = await Article.findById(articleId);

        // Comments of a draft are visible only to its author and admins
        if (!article || (article.status !== "published" && !isOwnerOrAdmin(article, req.user))) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        const filter = { article: article._id };

        // Everyone sees active comments only.
        // Admins see all statuses, or can filter with ?status=hidden|deleted|active
        if (req.user?.role === "admin") {
            const { status } = req.query;
            if (status) {
                if (!["active", "hidden", "deleted"].includes(status)) {
                    return res.status(400).json({
                        success: false,
                        message: "Status must be active, hidden or deleted",
                    });
                }
                filter.status = status;
            }
        } else {
            filter.status = "active";
        }

        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .sort({ createdAt: -1 }) // uses the { article, createdAt } index
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("user", "fullName"),
            Comment.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: comments.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data: comments,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        console.error("Get Comments Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) CREATE COMMENT ----------
// POST /api/articles/:articleId/comments
const createComment = async (req, res) => {
    try {
        const { articleId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty",
            });
        }
        if (content.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot exceed 2000 characters",
            });
        }

        const article = await Article.findById(articleId);

        // Only published articles can be commented on
        if (!article || article.status !== "published") {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        const comment = await Comment.create({
            article: article._id,
            user: req.user._id, // from the token, never from req.body
            content: content.trim(),
            // status is never taken from the client; schema default is "active"
        });

        await comment.populate("user", "fullName");

        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        console.error("Create Comment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 3) DELETE COMMENT (soft delete) ----------
// DELETE /api/comments/:id   (comment owner or admin)
const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        // An already-deleted comment is treated as not found
        if (!comment || comment.status === "deleted") {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        const isOwner = comment.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this comment",
            });
        }

        comment.status = "deleted";
        await comment.save();

        res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID",
            });
        }
        console.error("Delete Comment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 4) MODERATE COMMENT ----------
// PATCH /api/comments/:id/moderate   (admin only)   body: { "status": "hidden" | "active" }
const moderateComment = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !["active", "hidden"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either active or hidden",
            });
        }

        const comment = await Comment.findById(req.params.id);

        // Deleted comments can't be moderated or restored
        if (!comment || comment.status === "deleted") {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        comment.status = status;
        await comment.save();
        await comment.populate("user", "fullName");

        res.status(200).json({
            success: true,
            message: status === "hidden" ? "Comment hidden" : "Comment restored",
            data: comment,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID",
            });
        }
        console.error("Moderate Comment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getComments,
    createComment,
    deleteComment,
    moderateComment,
};