const Bookmark = require("../models/bookmark.js");
const Article = require("../models/article.js");
const mongoose = require("mongoose");

const invalidId = (res) =>
    res.status(400).json({ success: false, message: "Invalid article ID" });

// ---------- 1) ADD BOOKMARK ----------
// POST /api/bookmarks/:articleId
const addBookmark = async (req, res) => {
    try {
        const { articleId } = req.params;

        if (!mongoose.isValidObjectId(articleId)) return invalidId(res);

        const article = await Article.findById(articleId).select("status");

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
            return res.status(409).json({
                success: false,
                message: "Article already bookmarked",
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
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

        // Filtering published articles BEFORE skip/limit keeps pages full
        // and makes total/totalPages accurate.
        const [result] = await Bookmark.aggregate([
            { $match: { user: req.user._id } },
            { $sort: { createdAt: -1 } }, // uses the { user, createdAt } index
            {
                $lookup: {
                    from: Article.collection.name,
                    localField: "article",
                    foreignField: "_id",
                    as: "article",
                },
            },
            { $unwind: "$article" }, // drops bookmarks whose article was deleted
            { $match: { "article.status": "published" } },
            {
                $facet: {
                    data: [
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { "article.content": 0 } },
                    ],
                    total: [{ $count: "count" }],
                },
            },
        ]);

        const data = await Bookmark.populate(result.data, {
            path: "article.author",
            select: "fullName",
            model: "User",
        });
        const total = result.total[0]?.count || 0;

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

        if (!mongoose.isValidObjectId(articleId)) return invalidId(res);

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
        console.error("Remove Bookmark Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { addBookmark, getBookmarks, removeBookmark };