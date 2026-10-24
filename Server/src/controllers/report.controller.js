
const Report = require("../models/Report");
const Comment = require("../models/Comment");

const createReport = async (req, res) => {
  try {
    const { reason, description } = req.body;

    const allowedReasons = [
      "spam",
      "harassment",
      "hate_speech",
      "misinformation",
      "inappropriate",
      "other",
    ];

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({ message: "Invalid report reason." });
    }

    const comment = await Comment.findById(req.params.commentId);

    if (!comment || comment.status === "deleted") {
      return res.status(404).json({ message: "Comment not found." });
    }

    if (comment.user.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot report your own comment.",
      });
    }

    const report = await Report.create({
      comment: comment._id,
      reportedBy: req.user._id,
      reason,
      description,
    });

    res.status(201).json({
      message: "Report submitted successfully.",
      report,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("comment", "content status")
      .populate("reportedBy", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReport = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const allowedStatuses = [
      "pending",
      "reviewing",
      "resolved",
      "dismissed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid report status." });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    report.status = status;

    if (adminNote !== undefined) {
      report.adminNote = adminNote;
    }

    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    res.json({ message: "Report updated.", report });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createReport, getReports, updateReport };
