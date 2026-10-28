const Report = require("../models/report.js");
const Comment = require("../models/comment.js");

// ---------- constants (must match the schema enums) ----------
const REASONS = [
    "spam",
    "harassment",
    "hate_speech",
    "misinformation",
    "inappropriate",
    "other",
];
const STATUSES = ["pending", "reviewing", "resolved", "dismissed"];

// ---------- 1) CREATE REPORT ----------
// POST /api/comments/:commentId/reports
const createReport = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { reason, description } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Reason is required",
            });
        }
        if (!REASONS.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: `Reason must be one of: ${REASONS.join(", ")}`,
            });
        }
        if (description && description.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 1000 characters",
            });
        }

        const comment = await Comment.findById(commentId);

        // Only visible (active) comments can be reported
        if (!comment || comment.status !== "active") {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        if (comment.user.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot report your own comment",
            });
        }

        // The { comment, reportedBy } index is NOT unique, so check manually
        const alreadyReported = await Report.exists({
            comment: comment._id,
            reportedBy: req.user._id,
        });
        if (alreadyReported) {
            return res.status(400).json({
                success: false,
                message: "You have already reported this comment",
            });
        }

        const report = await Report.create({
            comment: comment._id,
            reportedBy: req.user._id, // from the token, never from req.body
            reason,
            description: description ? description.trim() : "",
            // status, adminNote, reviewedBy and reviewedAt are admin-controlled
        });

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: report,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid comment ID",
            });
        }
        console.error("Create Report Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) GET REPORTS ----------
// GET /api/reports?status=pending&reason=spam&comment=<id>&page=1&limit=10   (admin only)
const getReports = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
        const { status, reason, comment } = req.query;

        const filter = {};

        if (status) {
            if (!STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status must be one of: ${STATUSES.join(", ")}`,
                });
            }
            filter.status = status;
        }
        if (reason) {
            if (!REASONS.includes(reason)) {
                return res.status(400).json({
                    success: false,
                    message: `Reason must be one of: ${REASONS.join(", ")}`,
                });
            }
            filter.reason = reason;
        }
        if (comment) filter.comment = comment;

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .sort({ createdAt: -1 }) // uses the { status, createdAt } index
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({
                    path: "comment",
                    select: "content status article user",
                    populate: { path: "user", select: "fullName" },
                })
                .populate("reportedBy", "fullName email")
                .populate("reviewedBy", "fullName"),
            Report.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: reports.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data: reports,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid filter value",
            });
        }
        console.error("Get Reports Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 3) UPDATE REPORT ----------
// PATCH /api/reports/:id   (admin only)   body: { status?, adminNote? }
const updateReport = async (req, res) => {
    try {
        const { status, adminNote } = req.body;

        if (status === undefined && adminNote === undefined) {
            return res.status(400).json({
                success: false,
                message: "Provide a status or an admin note to update",
            });
        }
        if (status !== undefined && !STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${STATUSES.join(", ")}`,
            });
        }
        if (adminNote !== undefined && adminNote.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Admin note cannot exceed 2000 characters",
            });
        }

        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Report not found",
            });
        }

        if (status !== undefined) report.status = status;
        if (adminNote !== undefined) report.adminNote = adminNote.trim();

        // Record who reviewed it and when (set by the server, never by the client)
        report.reviewedBy = req.user._id;
        report.reviewedAt = new Date();

        const updatedReport = await report.save(); // runs schema validators

        await updatedReport.populate([
            { path: "reportedBy", select: "fullName email" },
            { path: "reviewedBy", select: "fullName" },
        ]);

        res.status(200).json({
            success: true,
            message: "Report updated successfully",
            data: updatedReport,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid report ID",
            });
        }
        console.error("Update Report Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { createReport, getReports, updateReport };
