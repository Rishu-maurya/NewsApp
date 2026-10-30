const mongoose = require("mongoose");
const Article = require("../models/Article.js");
const Comment = require("../models/Comment.js");

// ---------- helpers ----------
const MAX_LENGTH = 2000;
const STATUSES = ["active", "hidden", "deleted"];

const isOwnerOrAdmin = (article, user) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return !!article.author && article.author.toString() === user._id.toString();
};

const badId = (res, label) =>
    res.status(400).json({ success: false, message: `Invalid ${label} ID` });

// ---------- 1) GET COMMENTS OF AN ARTICLE ----------
// GET /api/articles/:articleId/comments?page=1&limit=10
// Public route: needs optionalAuth so req.user is set when a token is sent
const getComments = async (req, res) => {
    try {
        const { articleId } = req.params;
        if (!mongoose.isValidObjectId(articleId)) return badId(res, "article");

        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

        const article = await Article.findById(articleId).select("status author");

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
                if (typeof status !== "string" || !STATUSES.includes(status)) {
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
        console.error("Get Comments Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) CREATE COMMENT ----------
// POST /api/articles/:articleId/comments   body: { "content": "..." }
const createComment = async (req, res) => {
    try {
        const { articleId } = req.params;
        if (!mongoose.isValidObjectId(articleId)) return badId(res, "article");

        const { content } = req.body || {};

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty",
            });
        }
        const text = content.trim();
        if (text.length > MAX_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `Comment cannot exceed ${MAX_LENGTH} characters`,
            });
        }

        const article = await Article.findById(articleId).select("status");

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
            content: text,
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
        console.error("Create Comment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 3) DELETE COMMENT (soft delete) ----------
// DELETE /api/comments/:id   (comment owner or admin)
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return badId(res, "comment");

        const comment = await Comment.findById(id);

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
        console.error("Delete Comment Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 4) MODERATE COMMENT ----------
// PATCH /api/comments/:id/moderate   (admin only, enforced by adminOnly in the route)
// body: { "status": "hidden" | "active" }
const moderateComment = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return badId(res, "comment");

        const { status } = req.body || {};

        if (!["active", "hidden"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either active or hidden",
            });
        }

        const comment = await Comment.findById(id);

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