const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    article: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decision: {
      type: String,
      enum: ["approved", "rejected", "changes_requested"],
      required: true,
    },
    feedback: {
      type: String,
      required: true,
      maxlength: 3000,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ article: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
