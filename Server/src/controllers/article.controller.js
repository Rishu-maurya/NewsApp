const Article = require("../models/article");
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

        res.status(200).json({
            success: true,
            data: article,
        });
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
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: articles.length,
            data: articles,
        });
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

        const { title, body, summary, category, tags, featuredImage, status } = req.body || {};

        if (title !== undefined) {
            if (typeof title !== "string" || title.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: "Title must be at least 5 characters",
                });
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
            if (status === "submitted") article.reviewNote = ""; // new review round
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

// 5) EDITOR REVIEW QUEUE
// GET /api/articles/review  (editor, admin)
// Stories waiting for a decision, plus the most recent decisions.
const getReviewQueue = async (req, res) => {
    try {
        const [pending, decided] = await Promise.all([
            Article.find({ status: { $in: ["submitted", "under_review"] } })
                .populate("author", "fullName")
                .populate("category", "name slug")
                .sort({ updatedAt: 1 }),
            Article.find({ status: { $in: ["published", "changes_requested", "rejected"] } })
                .select("-body")
                .populate("author", "fullName")
                .populate("category", "name slug")
                .sort({ updatedAt: -1 })
                .limit(50),
        ]);

        res.status(200).json({ success: true, data: { pending, decided } });
    } catch (error) {
        console.error("Get Review Queue Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 6) EDITOR DECISION
// PATCH /api/articles/:id/review   body: { decision, note }
// decision: "published" | "changes_requested" | "rejected"
const reviewArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision, note } = req.body || {};

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid article ID" });
        }
        if (!["published", "changes_requested", "rejected"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be published, changes_requested or rejected",
            });
        }

        const cleanNote = typeof note === "string" ? note.trim() : "";
        if (decision !== "published" && !cleanNote) {
            return res.status(400).json({
                success: false,
                message: "Add feedback so the journalist knows what to fix",
            });
        }
        if (cleanNote.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Feedback must be 1000 characters or fewer",
            });
        }

        const article = await Article.findById(id);
        if (!article) {
            return res.status(404).json({ success: false, message: "Article not found" });
        }
        if (!["submitted", "under_review"].includes(article.status)) {
            return res.status(409).json({
                success: false,
                message: "Only stories waiting for review can be decided",
            });
        }

        article.status = decision;
        article.reviewNote = decision === "published" ? "" : cleanNote;
        article.reviewedBy = req.user._id;
        if (decision === "published") article.publishedAt = new Date();

        await article.save();

        res.status(200).json({
            success: true,
            message:
                decision === "published"
                    ? "Story published"
                    : decision === "rejected"
                        ? "Story rejected"
                        : "Changes requested",
            data: article,
        });
    } catch (error) {
        console.error("Review Article Error:", error);
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
    reviewArticle,
};
