const Bookmark = require("../models/Bookmark.js");
const Article = require("../models/Article.js");

// ---------- 1) ADD BOOKMARK ----------
// POST /api/bookmarks/:articleId
const addBookmark = async (req, res) => {
    try {
        const { articleId } = req.params;

        const article = await Article.findById(articleId);

        // Only published articles can be bookmarked; drafts look like "not found"
        if (!article || article.status !== "published") {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        const bookmark = await Bookmark.create({
            article: article._id,
            user: req.user._id, // from the token, never from req.body
        });

        res.status(201).json({
            success: true,
            message: "Article bookmarked successfully",
            data: bookmark,
        });
    } catch (error) {
        if (error.code === 11000) {
            // unique index on { article, user }
            return res.status(400).json({
                success: false,
                message: "Article already bookmarked",
            });
        }
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
        console.error("Add Bookmark Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) GET MY BOOKMARKS ----------
// GET /api/bookmarks?page=1&limit=10
const getBookmarks = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

        const filter = { user: req.user._id };

        const [bookmarks, total] = await Promise.all([
            Bookmark.find(filter)
                .sort({ createdAt: -1 }) // uses the { user, createdAt } index
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({
                    path: "article",
                    match: { status: "published" }, // hides unpublished articles
                    select: "-content",
                    populate: { path: "author", select: "fullName" },
                }),
            Bookmark.countDocuments(filter),
        ]);

        // populate returns null for articles that were deleted or unpublished
        const data = bookmarks.filter((b) => b.article);

        res.status(200).json({
            success: true,
            count: data.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data,
        });
    } catch (error) {
        console.error("Get Bookmarks Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 3) REMOVE BOOKMARK ----------
// DELETE /api/bookmarks/:articleId
const removeBookmark = async (req, res) => {
    try {
        const { articleId } = req.params;

        // Filtering by user means you can only remove your own bookmarks
        const bookmark = await Bookmark.findOneAndDelete({
            article: articleId,
            user: req.user._id,
        });

        if (!bookmark) {
            return res.status(404).json({
                success: false,
                message: "Bookmark not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Bookmark removed successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        console.error("Remove Bookmark Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { addBookmark, getBookmarks, removeBookmark };