
const Comment = require("../models/Comment");
const Article = require("../models/Article");

const getComments = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.articleId,
      status: "published",
    });

    if (!article) {
      return res.status(404).json({ message: "Published article not found." });
    }

    const comments = await Comment.find({
      article: article._id,
      status: "active",
    })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    const article = await Article.findOne({
      _id: req.params.articleId,
      status: "published",
    });

    if (!article) {
      return res.status(404).json({ message: "Published article not found." });
    }

    const comment = await Comment.create({
      article: article._id,
      user: req.user._id,
      content: content.trim(),
    });

    await comment.populate("user", "name profileImage");

    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const isOwner =
      comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied." });
    }

    // Soft delete preserves records referenced by reports.
    comment.status = "deleted";
    await comment.save();

    res.json({ message: "Comment deleted." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const moderateComment = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "hidden", "deleted"].includes(status)) {
      return res.status(400).json({ message: "Invalid comment status." });
    }

    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    res.json({ message: "Comment moderated.", comment });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getComments,
  createComment,
  deleteComment,
  moderateComment,
};
