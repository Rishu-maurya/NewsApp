const Article = require("../models/article");
const Review = require("../models/review");
const mongoose = require("mongoose")
const Category = require("../models/category")
const generateUniqueSlug = require("../utils/gernerateUniqueSlug");


// ---------- helpers ----------
const isOwnerOrAdmin = (article, user) => {
    if (!user) return false;
    const authorId = article.author?._id || article.author;
    return user.role === "admin" || authorId.toString() === user._id.toString();
};

// 1) CREATE 
const createArticle = async (req, res) => {
    try {
        const {
            title,
            body,
            summary,
            category,
            tags,
            featuredImage,
            publishDate = "",
            publishTime = "",
            important = false,
            status = "draft",
        } = req.body || {};

        if (typeof title !== "string" || !title.trim() ||
            typeof body !== "string" || !body.trim() ||
            typeof summary !== "string" || !summary.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Title, summary and body are required",
            });
        }


        if (typeof category !== "string" || !mongoose.isValidObjectId(category)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category id"
            })
        }
        if (!["draft", "submitted"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either draft or submitted",
            });
        }
        if (status === "submitted" && body.trim().length < 30) {
            return res.status(400).json({
                success: false,
                message: "Write at least 30 characters before sending for review",
            });
        }
        if (typeof publishDate !== "string" || (publishDate && !/^\d{4}-\d{2}-\d{2}$/.test(publishDate))) {
            return res.status(400).json({ success: false, message: "Invalid publish date" });
        }
        if (typeof publishTime !== "string" || (publishTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(publishTime))) {
            return res.status(400).json({ success: false, message: "Invalid publish time" });
        }
        if (publishTime && !publishDate) {
            return res.status(400).json({ success: false, message: "Publish date is required when a time is set" });
        }
        if (typeof important !== "boolean") {
            return res.status(400).json({ success: false, message: "Important must be true or false" });
        }

        const validCategory = await Category.findOne({ _id: category, isActive: true })

        if (!validCategory) {
            return res.status(400).json({
                success: false,
                message: "Invalid or inactive category",
            });
        }

        const slug = await generateUniqueSlug(title.trim());
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: "Title must contain letters or number"
            })
        }

        const article = await Article.create({
            title: title.trim(),
            slug,
            body: body.trim(),
            summary: summary.trim(),
            category: validCategory._id,
            tags: Array.isArray(tags) ? tags : [],
            featuredImage: featuredImage || "",
            publishDate,
            publishTime,
            important,
            author: req.user._id,
            status,
        });

        return res.status(201).json({
            success: true,
            message: "Article created successfully",
            data: article,
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Could not create article, please try again"
            })
        }

        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }

        console.error("Create Article Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 2) GET ALL
const getArticles = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const { category, tag, search, author, status } = req.query;

        const filter = {};

        // Guests/readers: published only. Authors: published, or own drafts.
        // Admins: anything, optionally filtered by status.
        const role = req.user?.role;
        if (role === "admin") {
            if (status) filter.status = status;
        } else if (role === "journalist" || role === "publisher") {
            if (status === "draft") {
                filter.status = "draft";
                filter.author = req.user._id;
            } else {
                filter.status = "published";
            }
        } else {
            filter.status = "published";
        }

        if (category) filter.category = category;
        if (tag) filter.tags = tag;
        if (author && !filter.author) filter.author = author;
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.title = { $regex: escaped, $options: "i" };
        }

        const [articles, total] = await Promise.all([
            Article.find(filter)
                .select("-body")
                .populate("author", "fullName")
                .populate("category", "name slug")
                .sort({ publishedAt: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Article.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: articles.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data: articles,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid filter value",
            });
        }
        console.error("Get Articles Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 3) GET ONE
const getArticleById = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id)
        .populate("author", "fullName")
        .populate("category", "name slug");

        if (!article || (article.status !== "published" && !isOwnerOrAdmin(article, req.user))) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        const data = article.toObject();
        if (
            isOwnerOrAdmin(article, req.user) &&
            ["changes_requested", "rejected"].includes(article.status)
        ) {
            const last = await Review.findOne({ article: article._id }).sort({ createdAt: -1 });
            data.reviewNote = last?.feedback || "";
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        console.error("Get Article Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getMyArticles = async (req, res) => {
    try {
        const articles = await Article.find({ author: req.user._id })
            .populate("category", "name slug")
            .select("title summary body category status publishDate publishTime important createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .lean();

        const needNote = articles
            .filter((a) => ["changes_requested", "rejected"].includes(a.status))
            .map((a) => a._id);

        const reviews = await Review.find({ article: { $in: needNote } }).sort({ createdAt: -1 });
        const notes = {};
        reviews.forEach((r) => {
            const key = r.article.toString();
            if (!notes[key]) notes[key] = r.feedback;   // sabse naya feedback
        });

        const data = articles.map((a) => ({ ...a, reviewNote: notes[a._id.toString()] || "" }));

        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        console.error("Get My Articles Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// 4) UPDATE
const updateArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }
        if (!isOwnerOrAdmin(article, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this article",
            });
        }
        if (!["draft", "changes_requested"].includes(article.status)) {
            return res.status(409).json({
                success: false,
                message: "Only drafts or stories with requested changes can be edited",
            });
        }

        const {
            title,
            body,
            summary,
            category,
            tags,
            featuredImage,
            publishDate,
            publishTime,
            important,
            status,
        } = req.body || {};

        if (title !== undefined) {
            if (typeof title !== "string" || title.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: "Title must be at least 5 characters",
                });
            }

            if (title.trim() !== article, title) {
                article.title = title.trim();
                article.slug = await generateUniqueSlug(title.trim())
            }
            article.title = title.trim();
            article.slug = await generateUniqueSlug(title.trim());
        }
        if (body !== undefined) {
            if (typeof body !== "string" || !body.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Story cannot be empty",
                });
            }
            article.body = body.trim();
        }
        if (summary !== undefined) {
            if (typeof summary !== "string" || !summary.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Summary cannot be empty",
                });
            }
            article.summary = summary.trim();
        }
        if (category !== undefined) {
            if (typeof category !== "string" || !mongoose.isValidObjectId(category)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid category id",
                });
            }
            const validCategory = await Category.findOne({ _id: category, isActive: true });
            if (!validCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or inactive category",
                });
            }
            article.category = validCategory._id;
        }
        if (status !== undefined) {
            if (!["draft", "submitted"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be either draft or submitted",
                });
            }
            if (status === "submitted" && article.body.trim().length < 30) {
                return res.status(400).json({
                    success: false,
                    message: "Write at least 30 characters before sending for review",
                });
            }
            article.status = status;
        }
        if (tags !== undefined) {
            if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
                return res.status(400).json({
                    success: false,
                    message: "Tags must be a list of strings",
                });
            }
            article.tags = tags;
        }
        if (featuredImage !== undefined) article.featuredImage = featuredImage;
        if (publishDate !== undefined) {
            if (typeof publishDate !== "string" || (publishDate && !/^\d{4}-\d{2}-\d{2}$/.test(publishDate))) {
                return res.status(400).json({ success: false, message: "Invalid publish date" });
            }
            article.publishDate = publishDate;
            if (!publishDate) article.publishTime = "";
        }
        if (publishTime !== undefined) {
            if (typeof publishTime !== "string" || (publishTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(publishTime))) {
                return res.status(400).json({ success: false, message: "Invalid publish time" });
            }
            if (publishTime && !(publishDate ?? article.publishDate)) {
                return res.status(400).json({ success: false, message: "Publish date is required when a time is set" });
            }
            article.publishTime = publishTime;
        }
        if (important !== undefined) {
            if (typeof important !== "boolean") {
                return res.status(400).json({ success: false, message: "Important must be true or false" });
            }
            article.important = important;
        }
        // author is never updatable

        const updatedArticle = await article.save();

        return res.status(200).json({
            success: true,
            message: "Article updated successfully",
            data: updatedArticle,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "An article with this title already exists",
            });
        }
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
        console.error("Update Article Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 5) DELETE 
const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }
        if (!isOwnerOrAdmin(article, req.user)) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this article",
            });
        }
        if (!["draft", "rejected"].includes(article.status)) {
            return res.status(409).json({
                success: false,
                message: "Only drafts or rejected stories can be deleted",
            });
        }

        await article.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Article deleted successfully",
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        console.error("Delete Article Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getReviewQueue = async (req, res) => {
    try {
        const [pending, decided, countRows] = await Promise.all([
            Article.find({ status: "submitted" })
                .populate("author", "fullName")
                .populate("category", "name slug")
                .sort({ updatedAt: 1 }),
            Article.find({ status: { $in: ["approved", "published", "changes_requested", "rejected"] } })
                .select("-body")
                .populate("author", "fullName")
                .populate("category", "name slug")
                .sort({ updatedAt: -1 })
                .limit(20),
            Article.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        ]);

        const counts = {};
        countRows.forEach((row) => { counts[row._id] = row.count; });

        res.status(200).json({ success: true, data: { pending, decided, counts } });
    } catch (error) {
        console.error("Get Review Queue Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getPublishQueue = async (req, res) => {
    try {
        const articles = await Article.find({ status: "approved" })
            .populate("author", "fullName")
            .populate("category", "name slug")
            .sort({ updatedAt: 1 });

        res.status(200).json({ success: true, count: articles.length, data: articles });
    } catch (error) {
        console.error("Get Publish Queue Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    createArticle,
    getArticles,
    getMyArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    getReviewQueue,
    getPublishQueue,
};
