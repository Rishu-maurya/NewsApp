const Article = require("../models/article.js");
const Review = require("../models/Review.js");


const ARTICLE_STATUS = {
    PENDING: "pending_review",
    APPROVED: "approved",
    REJECTED: "rejected",
    CHANGES_REQUESTED: "changes_requested",
    PUBLISHED: "published",
};

// review decision -> new article status
const DECISION_TO_STATUS = {
    approved: ARTICLE_STATUS.APPROVED,
    rejected: ARTICLE_STATUS.REJECTED,
    changes_requested: ARTICLE_STATUS.CHANGES_REQUESTED,
};

// ---------- 1) GET REVIEWS OF AN ARTICLE ----------
// GET /api/articles/:articleId/reviews?page=1&limit=10
// Visible to: the article's author, editors and admins
const getReviews = async (req, res) => {
    try {
        const { articleId } = req.params;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

        const article = await Article.findById(articleId);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        const isStaff = ["editor", "admin"].includes(req.user.role);
        const isAuthor = article.author.toString() === req.user._id.toString();

        if (!isStaff && !isAuthor) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view these reviews",
            });
        }

        const filter = { article: article._id };

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .sort({ createdAt: -1 }) // uses the { article, createdAt } index
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("editor", "fullName"),
            Review.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: reviews.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data: reviews,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid article ID",
            });
        }
        console.error("Get Reviews Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) CREATE REVIEW ----------
// POST /api/articles/:articleId/reviews   (editor or admin)
// body: { decision: "approved" | "rejected" | "changes_requested", feedback }
const createReview = async (req, res) => {
    try {
        const { articleId } = req.params;
        const { decision, feedback } = req.body;

        if (!decision || !feedback || !feedback.trim()) {
            return res.status(400).json({
                success: false,
                message: "Decision and feedback are required",
            });
        }
        if (!DECISION_TO_STATUS[decision]) {
            return res.status(400).json({
                success: false,
                message: "Decision must be approved, rejected or changes_requested",
            });
        }
        if (feedback.trim().length > 3000) {
            return res.status(400).json({
                success: false,
                message: "Feedback cannot exceed 3000 characters",
            });
        }

        const article = await Article.findById(articleId);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        if (article.author.toString() === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot review your own article",
            });
        }

        // Only articles submitted for review can be reviewed
        if (article.status !== ARTICLE_STATUS.PENDING) {
            return res.status(400).json({
                success: false,
                message: "Only articles pending review can be reviewed",
            });
        }

        const review = await Review.create({
            article: article._id,
            editor: req.user._id, // from the token, never from req.body
            decision,
            feedback: feedback.trim(),
        });

        // Move the article to the state that matches the decision
        article.status = DECISION_TO_STATUS[decision];
        await article.save();

        await review.populate("editor", "fullName");

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: {
                review,
                articleStatus: article.status,
            },
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
        console.error("Create Review Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 3) PUBLISH ARTICLE ----------
// PATCH /api/articles/:articleId/publish   (editor or admin)
const publishArticle = async (req, res) => {
    try {
        const article = await Article.findById(req.params.articleId);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found",
            });
        }

        if (article.status === ARTICLE_STATUS.PUBLISHED) {
            return res.status(400).json({
                success: false,
                message: "Article is already published",
            });
        }
        if (article.status !== ARTICLE_STATUS.APPROVED) {
            return res.status(400).json({
                success: false,
                message: "Only approved articles can be published",
            });
        }

        // Safety check: the most recent review must be an approval
        const latestReview = await Review.findOne({ article: article._id }).sort({
            createdAt: -1,
        });
        if (!latestReview || latestReview.decision !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Article has no approving review",
            });
        }

        article.status = ARTICLE_STATUS.PUBLISHED;
        await article.save();

        res.status(200).json({
            success: true,
            message: "Article published successfully",
            data: article,
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
        console.error("Publish Article Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { getReviews, createReview, publishArticle };