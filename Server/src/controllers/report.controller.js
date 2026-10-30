const mongoose = require("mongoose");
const Report = require("../models/Report.js");
const Comment = require("../models/Comment.js");

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
const MAX_DESCRIPTION = 1000;
const MAX_NOTE = 2000;

const badId = (res, label) =>
    res.status(400).json({ success: false, message: `Invalid ${label} ID` });

// ---------- 1) CREATE REPORT ----------
// POST /api/comments/:commentId/reports   body: { reason, description? }
const createReport = async (req, res) => {
    try {
        const { commentId } = req.params;
        if (!mongoose.isValidObjectId(commentId)) return badId(res, "comment");

        const { reason, description } = req.body || {};

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Reason is required",
            });
        }
        if (typeof reason !== "string" || !REASONS.includes(reason)) {
            return res.status(400).json({
                success: false,
                message: `Reason must be one of: ${REASONS.join(", ")}`,
            });
        }
        if (description !== undefined && typeof description !== "string") {
            return res.status(400).json({
                success: false,
                message: "Description must be text",
            });
        }
        const cleanDescription = description ? description.trim() : "";
        if (cleanDescription.length > MAX_DESCRIPTION) {
            return res.status(400).json({
                success: false,
                message: `Description cannot exceed ${MAX_DESCRIPTION} characters`,
            });
        }

        const comment = await Comment.findById(commentId).select("status user");

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

        // Friendly pre-check. The unique index (see notes) is what stops race conditions.
        const alreadyReported = await Report.exists({
            comment: comment._id,
            reportedBy: req.user._id,
        });
        if (alreadyReported) {
            return res.status(409).json({
                success: false,
                message: "You have already reported this comment",
            });
        }

        const report = await Report.create({
            comment: comment._id,
            reportedBy: req.user._id, // from the token, never from req.body
            reason,
            description: cleanDescription,
            // status, adminNote, reviewedBy and reviewedAt are admin-controlled
        });

        res.status(201).json({
            success: true,
            message: "Report submitted successfully",
            data: report,
        });
    } catch (error) {
        if (error.code === 11000) {
            // unique index on { comment, reportedBy }
            return res.status(409).json({
                success: false,
                message: "You have already reported this comment",
            });
        }
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Create Report Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) GET REPORTS ----------
// GET /api/reports?status=pending&reason=spam&comment=<id>&page=1&limit=10   (admin only)
const getReports = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const { status, reason, comment } = req.query;

        const filter = {};

        if (status) {
            if (typeof status !== "string" || !STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Status must be one of: ${STATUSES.join(", ")}`,
                });
            }
            filter.status = status;
        }
        if (reason) {
            if (typeof reason !== "string" || !REASONS.includes(reason)) {
                return res.status(400).json({
                    success: false,
                    message: `Reason must be one of: ${REASONS.join(", ")}`,
                });
            }
            filter.reason = reason;
        }
        if (comment) {
            if (typeof comment !== "string" || !mongoose.isValidObjectId(comment)) {
                return badId(res, "comment");
            }
            filter.comment = comment;
        }

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
        console.error("Get Reports Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 3) UPDATE REPORT ----------
// PATCH /api/reports/:id   (admin only)   body: { status?, adminNote? }
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return badId(res, "report");

        const { status, adminNote } = req.body || {};

        if (status === undefined && adminNote === undefined) {
            return res.status(400).json({
                success: false,
                message: "Provide a status or an admin note to update",
            });
        }
        if (status !== undefined && (typeof status !== "string" || !STATUSES.includes(status))) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${STATUSES.join(", ")}`,
            });
        }
        if (adminNote !== undefined) {
            if (typeof adminNote !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Admin note must be text",
                });
            }
            if (adminNote.trim().length > MAX_NOTE) {
                return res.status(400).json({
                    success: false,
                    message: `Admin note cannot exceed ${MAX_NOTE} characters`,
                });
            }
        }

        const report = await Report.findById(id);

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

        await report.save(); // runs schema validators

        await report.populate([
            { path: "reportedBy", select: "fullName email" },
            { path: "reviewedBy", select: "fullName" },
        ]);

        res.status(200).json({
            success: true,
            message: "Report updated successfully",
            data: report,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Update Report Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = { createReport, getReports, updateReport };
