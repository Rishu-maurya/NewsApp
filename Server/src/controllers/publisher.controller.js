const mongoose = require("mongoose");
const User = require("../models/users.js");
const Article = require("../models/article.js");

const STAFF_ROLES = ["journalist", "editor"];

const invalidId = (res, what = "ID") =>
    res.status(400).json({ success: false, message: `Invalid ${what}` });

const notFound = (res, what) =>
    res.status(404).json({ success: false, message: `${what} not found` });

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
//  PART 1: JOURNALIST / EDITOR ACCESS REQUESTS
// =====================================================================

// ---------- 1) LIST PENDING REQUESTS ----------
// GET /api/publisher/requests?role=journalist|editor&page=1&limit=10
const getPendingRequests = async (req, res) => {
    try {
        const { page, limit } = paging(req);
        const filter = { approvalStatus: "pending" };

        if (req.query.role) {
            if (!STAFF_ROLES.includes(req.query.role)) {
                return res.status(400).json({
                    success: false,
                    message: `Role must be one of: ${STAFF_ROLES.join(", ")}`,
                });
            }
            filter.requestedRole = req.query.role;
        }

        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: users,
        });
    } catch (error) {
        serverError(res, "Get Pending Requests Error", error);
    }
};

// ---------- 2) APPROVE A REQUEST ----------
// PATCH /api/publisher/requests/:id/approve
// Gives the person the role they asked for and lets them log in.
const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res, "user ID");

        // Single atomic update: only a user who is still pending can be approved,
        // so two publishers clicking at once cannot double-approve.
        const user = await User.findOneAndUpdate(
            { _id: id, approvalStatus: "pending", requestedRole: { $in: STAFF_ROLES } },
            [
                {
                    $set: {
                        role: "$requestedRole",
                        approvalStatus: "approved",
                        approvedBy: req.user._id,
                        approvedAt: new Date(),
                        requestedRole: null,
                    },
                },
            ],
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No pending request found for this user",
            });
        }

        res.status(200).json({
            success: true,
            message: `${user.fullName} approved as ${user.role}`,
            data: user,
        });
    } catch (error) {
        serverError(res, "Approve Request Error", error);
    }
};

// ---------- 3) LIST APPROVED STAFF ----------
// GET /api/publisher/staff?role=editor&isActive=true&search=ravi
const getStaff = async (req, res) => {
    try {
        const { page, limit } = paging(req);
        const { role, isActive, search } = req.query;

        const filter = {
            role: { $in: STAFF_ROLES },
            approvalStatus: { $ne: "pending" }, // $ne so old users with no field are included
        };

        if (role) {
            if (!STAFF_ROLES.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Role must be one of: ${STAFF_ROLES.join(", ")}`,
                });
            }
            filter.role = role;
        }
        if (isActive === "true") filter.isActive = true;
        if (isActive === "false") filter.isActive = false;

        if (search) {
            if (typeof search !== "string") {
                return res.status(400).json({ success: false, message: "Search must be text" });
            }
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { fullName: { $regex: escaped, $options: "i" } },
                { email: { $regex: escaped, $options: "i" } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            data: users,
        });
    } catch (error) {
        serverError(res, "Get Staff Error", error);
    }
};

// ---------- 4) DELETE A REQUEST OR A STAFF MEMBER ----------
// DELETE /api/publisher/staff/:id
// - pending request          -> removed from the database
// - journalist / editor      -> removed, unless they still own work (then 409: block instead)
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res, "user ID");

        if (req.user._id.toString() === id) {
            return res.status(400).json({ success: false, message: "You cannot delete your own account" });
        }

        const user = await User.findById(id);
        if (!user) return notFound(res, "User");

        const isPending = user.approvalStatus === "pending";
        const isStaff = STAFF_ROLES.includes(user.role);

        // A publisher may only remove journalists, editors and pending requests.
        // Readers, other publishers and admins are not theirs to delete.
        if (!isPending && !isStaff) {
            return res.status(403).json({
                success: false,
                message: "Publishers can only remove journalists, editors and pending requests",
            });
        }

        if (!isPending) {
            // Deleting would leave articles pointing at a user that no longer exists
            const [wroteArticles, holdsAssignments] = await Promise.all([
                Article.exists({ author: user._id }),
                Article.exists({
                    assignedEditor: user._id,
                    status: { $in: ["assigned", "changes_requested", "edited"] },
                }),
            ]);

            if (wroteArticles || holdsAssignments) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This user has articles or active assignments. Block them instead " +
                        "(PATCH /api/publisher/staff/:id/status) or reassign their work first.",
                });
            }
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: isPending ? "Request rejected and removed" : `${user.fullName} removed`,
        });
    } catch (error) {
        serverError(res, "Delete Staff Error", error);
    }
};

// ---------- 5) BLOCK / UNBLOCK STAFF ----------
// PATCH /api/publisher/staff/:id/status   body: { isActive: true | false }
// The safe alternative to deleting someone who already has articles.
const updateStaffStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res, "user ID");

        const { isActive } = req.body || {};
        if (typeof isActive !== "boolean") {
            return res.status(400).json({ success: false, message: "isActive must be true or false" });
        }
        if (req.user._id.toString() === id) {
            return res.status(400).json({ success: false, message: "You cannot change your own status" });
        }

        const user = await User.findOneAndUpdate(
            { _id: id, role: { $in: STAFF_ROLES }, approvalStatus: { $ne: "pending" } },
            { $set: { isActive } },
            { new: true }
        );
        if (!user) return notFound(res, "Journalist or editor");

        res.status(200).json({
            success: true,
            message: isActive ? "User unblocked" : "User blocked",
            data: user,
        });
    } catch (error) {
        serverError(res, "Update Staff Status Error", error);
    }
};

// =====================================================================
//  PART 2: ARTICLE APPROVAL AND EDITOR ASSIGNMENT
// =====================================================================

// ---------- 6) LIST ARTICLES FOR THE PUBLISHER ----------
// GET /api/publisher/articles?status=submitted|approved|assigned|edited|...
// Default shows what needs the publisher's attention: submitted + edited.
const getArticlesForPublisher = async (req, res) => {
    try {
        const { page, limit } = paging(req);
        const { status } = req.query;

        const ALLOWED = [
            "submitted", "approved", "rejected", "assigned",
            "edited", "changes_requested", "published",
        ];

        const filter = {};
        if (status) {
            if (typeof status !== "string" || !ALLOWED.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status must be one of: ${ALLOWED.join(", ")}`,
                });
            }
            filter.status = status;
        } else {
            filter.status = { $in: ["submitted", "edited"] };
        }

        const [articles, total] = await Promise.all([
            Article.find(filter)
                .populate("author", "fullName email")
                .populate("assignedEditor", "fullName email")
                .populate("category", "name")
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
        serverError(res, "Get Publisher Articles Error", error);
    }
};

// ---------- 7) APPROVE / REJECT A JOURNALIST'S NEWS ----------
// PATCH /api/publisher/articles/:id/decision   body: { decision: "approved"|"rejected", note? }
const decideArticle = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res, "article ID");

        const { decision, note } = req.body || {};

        if (!["approved", "rejected"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be approved or rejected",
            });
        }
        const cleanNote = typeof note === "string" ? note.trim() : "";
        if (decision === "rejected" && !cleanNote) {
            return res.status(400).json({
                success: false,
                message: "Please give the journalist a reason for rejecting",
            });
        }
        if (cleanNote.length > 1000) {
            return res.status(400).json({ success: false, message: "Note cannot exceed 1000 characters" });
        }

        // Atomic: only a "submitted" article can be decided
        const article = await Article.findOneAndUpdate(
            { _id: id, status: "submitted" },
            { $set: { status: decision, publisherNote: cleanNote } },
            { new: true }
        );

        if (!article) {
            return res.status(400).json({
                success: false,
                message: "Article not found or not waiting for a decision",
            });
        }

        res.status(200).json({
            success: true,
            message: decision === "approved"
                ? "Article approved. Assign an editor next."
                : "Article rejected",
            data: article,
        });
    } catch (error) {
        serverError(res, "Decide Article Error", error);
    }
};

// ---------- 8) SEND AN APPROVED ARTICLE TO AN EDITOR ----------
// PATCH /api/publisher/articles/:id/assign   body: { editorId }
// Also used to reassign while the article is still with an editor.
const assignEditor = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res, "article ID");

        const { editorId } = req.body || {};
        if (typeof editorId !== "string" || !mongoose.isValidObjectId(editorId)) {
            return invalidId(res, "editor ID");
        }

        const editor = await User.findOne({
            _id: editorId,
            role: "editor",
            isActive: true,
            approvalStatus: { $ne: "pending" },
        });
        if (!editor) {
            return res.status(400).json({
                success: false,
                message: "Editor not found, blocked, or not approved",
            });
        }

        const article = await Article.findOneAndUpdate(
            { _id: id, status: { $in: ["approved", "assigned", "changes_requested"] } },
            {
                $set: {
                    status: "assigned",
                    assignedEditor: editor._id,
                    assignedBy: req.user._id,
                    assignedAt: new Date(),
                },
            },
            { new: true }
        ).populate("assignedEditor", "fullName email");

        if (!article) {
            return res.status(400).json({
                success: false,
                message: "Only approved articles can be assigned to an editor",
            });
        }

        res.status(200).json({
            success: true,
            message: `Article sent to ${editor.fullName}`,
            data: article,
        });
    } catch (error) {
        serverError(res, "Assign Editor Error", error);
    }
};

// ---------- 9) SEND EDITED ARTICLE BACK TO THE EDITOR ----------
// PATCH /api/publisher/articles/:id/request-changes   body: { note }
const requestChanges = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res, "article ID");

        const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
        if (!note) {
            return res.status(400).json({ success: false, message: "Please explain what needs to change" });
        }
        if (note.length > 1000) {
            return res.status(400).json({ success: false, message: "Note cannot exceed 1000 characters" });
        }

        const article = await Article.findOneAndUpdate(
            { _id: id, status: "edited" },
            { $set: { status: "changes_requested", publisherNote: note } },
            { new: true }
        );
        if (!article) {
            return res.status(400).json({
                success: false,
                message: "Article not found or has not been edited yet",
            });
        }

        res.status(200).json({ success: true, message: "Sent back to the editor", data: article });
    } catch (error) {
        serverError(res, "Request Changes Error", error);
    }
};

// ---------- 10) PUBLISH ----------
// PATCH /api/publisher/articles/:id/publish
const publishArticle = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res, "article ID");

        const article = await Article.findOneAndUpdate(
            { _id: id, status: "edited" },
            { $set: { status: "published", publishedAt: new Date(), publisherNote: "" } },
            { new: true }
        );
        if (!article) {
            return res.status(400).json({
                success: false,
                message: "Only articles finished by an editor can be published",
            });
        }

        res.status(200).json({ success: true, message: "Article published", data: article });
    } catch (error) {
        serverError(res, "Publish Article Error", error);
    }
};

module.exports = {
    getPendingRequests,
    approveRequest,
    getStaff,
    deleteStaff,
    updateStaffStatus,
    getArticlesForPublisher,
    decideArticle,
    assignEditor,
    requestChanges,
    publishArticle,
};