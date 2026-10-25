const Article = require("../models/Article");

// ---------- helpers ----------
const isOwnerOrAdmin = (article, user) => {
    if (!user) return false;
    const authorId = article.author?._id || article.author;
    return user.role === "admin" || authorId.toString() === user._id.toString();
};

// 1) CREATE 
const createArticle = async (req, res) => {
    try {
        const { title, content, summary, category, tags, coverImage, status } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: "Title and content are required",
            });
        }
        if (title.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: "Title must be at least 5 characters",
            });
        }
        if (status && !["draft", "published"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either draft or published",
            });
        }

        const newArticle = await Article.create({
            title: title.trim(),
            content,
            summary,
            category,
            tags,
            coverImage,
            status: status || "draft",
            author: req.user._id, // from the token, never from req.body
        });

        res.status(201).json({
            success: true,
            message: "Article created successfully",
            data: newArticle,
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
        } else if (role === "author") {
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
                .select("-content")
                .populate("author", "fullName")
                .sort({ createdAt: -1 })
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
        const article = await Article.findById(req.params.id).populate("author", "fullName");

        // Drafts return the same 404 to non-owners so their existence isn't leaked
        if (!article || (article.status === "draft" && !isOwnerOrAdmin(article, req.user))) {
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

        const { title, content, summary, category, tags, coverImage, status } = req.body;

        if (title !== undefined) {
            if (title.trim().length < 5) {
                return res.status(400).json({
                    success: false,
                    message: "Title must be at least 5 characters",
                });
            }
            article.title = title.trim();
        }
        if (content !== undefined) {
            if (!content) {
                return res.status(400).json({
                    success: false,
                    message: "Content cannot be empty",
                });
            }
            article.content = content;
        }
        if (status !== undefined) {
            if (!["draft", "published"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be either draft or published",
                });
            }
            article.status = status;
        }
        if (summary !== undefined) article.summary = summary;
        if (category !== undefined) article.category = category;
        if (tags !== undefined) article.tags = tags;
        if (coverImage !== undefined) article.coverImage = coverImage;
        // author is never updatable

        const updatedArticle = await article.save(); // runs schema validators

        res.status(200).json({
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

        await article.deleteOne();

        res.status(200).json({
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

module.exports = {
    createArticle,
    getArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
};
