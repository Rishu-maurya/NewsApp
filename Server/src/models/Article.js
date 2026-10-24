
const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: [true, "Article slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    summary: {
      type: String,
      required: [true, "Article summary is required"],
      maxlength: 500,
    },

    body: {
      type: String,
      required: [true, "Article body is required"],
    },

    featuredImage: {
      type: String,
      default: "",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "draft",
        "submitted",
        "under_review",
        "changes_requested",
        "approved",
        "rejected",
        "published",
        "archived",
      ],
      default: "draft",
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

articleSchema.index({
  title: "text",
  summary: "text",
  body: "text",
});

articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model("Article", articleSchema);
