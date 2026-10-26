const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment cannot be empty"],
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["active", "hidden", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

commentSchema.index({ article: 1, createdAt: -1 });
commentSchema.index({ user: 1 });

module.exports = mongoose.model("Comment", commentSchema);
