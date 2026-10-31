const mongoose = require("mongoose");
const Article = require("../models/article");

const invalidId = (res) =>
    res.status(400).json({ success: false, message: "Invalid article ID" });

const serverError = (res, label, error) => {
    if (error.name === "ValidationError") {
        const message = Object.values(error.errors)[0].message;
        return res.status(400).json({ success: false, message });
    }
    console.error(`${label}:`, error);
    return res.status(500).json({ success: false, message: "Server error" });
};

const paging = (req) => ({
    page: Math.max(parseInt(req.query.page, 10) || 1, 1),
    limit: Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50),
});

// =====================================================================
//  JOURNALIST
// =====================================================================

// ---------- 1) MY ARTICLES ----------
// GET /api/workflow/my-articles?status=submitted
const getMyArticles = async (req, res) => {
    try {
        const { page, limit } = paging(req);
        const filter = { author: req.user._id };
        if (typeof req.query.status === "string" && req.query.status) {
            filter.status = req.query.status;
        }

        const [articles, total] = await Promise.all([
            Article.find(filter)
                .select("-body")
                .populate("assignedEditor", "fullName")
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Article.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: articles.length,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: articles,
        });
    } catch (error) {
        serverError(res, "Get My Articles Error", error);
    }
};

// ---------- 2) SUBMIT NEWS TO THE PUBLISHER ----------
// PATCH /api/workflow/articles/:id/submit
// A journalist can submit their own draft, or resubmit one the publisher rejected.
const submitArticle = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const article = await Article.findOneAndUpdate(
            { _id: id, author: req.user._id, status: { $in: ["draft", "rejected"] } },
            { $set: { status: "submitted", submittedAt: new Date(), publisherNote: "" } },
            { new: true }
        );

        if (!article) {
            return res.status(400).json({
                success: false,
                message: "Article not found, not yours, or already submitted",
            });
        }

        res.status(200).json({
            success: true,
            message: "Submitted to the publisher",
            data: article,
        });
    } catch (error) {
        serverError(res, "Submit Article Error", error);
    }
};

// =====================================================================
//  EDITOR
// =====================================================================

// ---------- 3) ARTICLES ASSIGNED TO ME ----------
// GET /api/workflow/editor/articles?status=assigned|changes_requested|edited
const getAssignedArticles = async (req, res) => {
    try {
        const { page, limit } = paging(req);
        const ALLOWED = ["assigned", "changes_requested", "edited"];

        const filter = { assignedEditor: req.user._id };
        const { status } = req.query;

        if (status) {
            if (typeof status !== "string" || !ALLOWED.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status must be one of: ${ALLOWED.join(", ")}`,
                });
            }
            filter.status = status;
        } else {
            // Default: the work that is waiting on the editor
            filter.status = { $in: ["assigned", "changes_requested"] };
        }

        const [articles, total] = await Promise.all([
            Article.find(filter)
                .populate("author", "fullName")
                .populate("category", "name")
                .sort({ assignedAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Article.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: articles.length,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: articles,
        });
    } catch (error) {
        serverError(res, "Get Assigned Articles Error", error);
    }
};

// ---------- 4) WRITE / EDIT THE CONTENT ----------
// PATCH /api/workflow/editor/articles/:id   body: { title?, summary?, body?, tags?, featuredImage? }
// Only the assigned editor, and only while the article is with them.
// The editor can NOT change status, author, category or the assignment here.
const editArticle = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const { title, summary, body, tags, featuredImage } = req.body || {};
        const set = {};

        if (title !== undefined) {
            if (typeof title !== "string" || title.trim().length < 5) {
                return res.status(400).json({ success: false, message: "Title must be at least 5 characters" });
            }
            set.title = title.trim();
        }
        if (summary !== undefined) {
            if (typeof summary !== "string" || !summary.trim()) {
                return res.status(400).json({ success: false, message: "Summary cannot be empty" });
            }
            set.summary = summary.trim();
        }
        if (body !== undefined) {
            if (typeof body !== "string" || !body.trim()) {
                return res.status(400).json({ success: false, message: "Body cannot be empty" });
            }
            set.body = body.trim();
        }
        if (tags !== undefined) {
            if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string")) {
                return res.status(400).json({ success: false, message: "Tags must be a list of text" });
            }
            set.tags = tags;
        }
        if (featuredImage !== undefined) {
            if (typeof featuredImage !== "string") {
                return res.status(400).json({ success: false, message: "Featured image must be text" });
            }
            set.featuredImage = featuredImage;
        }

        if (Object.keys(set).length === 0) {
            return res.status(400).json({ success: false, message: "Nothing to update" });
        }

        // runValidators so maxlength rules in the schema still apply
        const article = await Article.findOneAndUpdate(
            {
                _id: id,
                assignedEditor: req.user._id,
                status: { $in: ["assigned", "changes_requested"] },
            },
            { $set: set },
            { new: true, runValidators: true }
        );

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found, not assigned to you, or not open for editing",
            });
        }

        res.status(200).json({ success: true, message: "Article updated", data: article });
    } catch (error) {
        serverError(res, "Edit Article Error", error);
    }
};

// ---------- 5) HAND THE FINISHED ARTICLE BACK TO THE PUBLISHER ----------
// PATCH /api/workflow/editor/articles/:id/complete
const completeEditing = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const article = await Article.findOneAndUpdate(
            {
                _id: id,
                assignedEditor: req.user._id,
                status: { $in: ["assigned", "changes_requested"] },
            },
            { $set: { status: "edited", editedAt: new Date() } },
            { new: true }
        );

        if (!article) {
            return res.status(404).json({
                success: false,
                message: "Article not found, not assigned to you, or not open for editing",
            });
        }

        res.status(200).json({
            success: true,
            message: "Sent to the publisher for final approval",
            data: article,
        });
    } catch (error) {
        serverError(res, "Complete Editing Error", error);
    }
};

module.exports = {
    getMyArticles,
    submitArticle,
    getAssignedArticles,
    editArticle,
    completeEditing,
};