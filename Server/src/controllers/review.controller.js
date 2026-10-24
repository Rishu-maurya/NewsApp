
const Review = require("../models/Review");
const Article = require("../models/Article");

const getReviews = async (req, res) => {
  try {
    const filter = req.user.role === "editor" ? {} : {};

    // Editors can see reviews; admins can see all reviews.
    const reviews = await Review.find(filter)
      .populate("article", "title status")
      .populate("editor", "name email")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { decision, feedback } = req.body;
    const allowed = ["approved", "rejected", "changes_requested"];

    if (!allowed.includes(decision) || !feedback?.trim()) {
      return res.status(400).json({
        message: "A valid decision and feedback are required.",
      });
    }

    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (!["submitted", "under_review"].includes(article.status)) {
      return res.status(400).json({
        message: "Article is not awaiting review.",
      });
    }

    article.status = "under_review";
    await article.save();

    const review = await Review.create({
      article: article._id,
      editor: req.user._id,
      decision,
      feedback: feedback.trim(),
    });

    article.status = decision;
    await article.save();

    res.status(201).json({
      message: "Review submitted.",
      review,
      articleStatus: article.status,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const publishArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (article.status !== "approved") {
      return res.status(400).json({
        message: "Only approved articles can be published.",
      });
    }

    article.status = "published";
    article.publishedAt = new Date();
    await article.save();

    res.json({ message: "Article published.", article });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getReviews, createReview, publishArticle };
