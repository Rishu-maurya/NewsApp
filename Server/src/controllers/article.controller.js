const Article = require("../models/Article");
const Category = require("../models/Category");

const getArticles = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const filter = { status: "published" };

    if (category) {
      const categoryDoc = await Category.findOne({
        slug: category,
        isActive: true,
      });
      if (!categoryDoc) return res.json([]);
      filter.category = categoryDoc._id;
    }

    if (search) filter.$text = { $search: search };

    const articles = await Article.find(filter)
      .populate("author", "name profileImage")
      .populate("category", "name slug")
      .sort({ publishedAt: -1 })
      .skip((Math.max(1, Number(page)) - 1) * Math.min(50, Math.max(1, Number(limit))))
      .limit(Math.min(50, Math.max(1, Number(limit))));

    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate("author", "name profileImage")
      .populate("category", "name slug");

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    const isOwner =
      article.author._id.toString() === req.user?._id?.toString();
    const isStaff = ["editor", "admin"].includes(req.user?.role);

    if (article.status !== "published" && !isOwner && !isStaff) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (article.status === "published") {
      await Article.updateOne(
        { _id: article._id },
        { $inc: { viewCount: 1 } }
      );
    }

    res.json(article);
  } catch (error) {
    res.status(400).json({ message: "Invalid article ID." });
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, slug, summary, body, featuredImage, category, tags } =
      req.body;

    if (!title || !slug || !summary || !body || !category) {
      return res.status(400).json({
        message: "Title, slug, summary, body and category are required.",
      });
    }

    const validCategory = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!validCategory) {
      return res.status(400).json({ message: "Invalid or inactive category." });
    }

    const article = await Article.create({
      title,
      slug,
      summary,
      body,
      featuredImage,
      category,
      tags,
      author: req.user._id,
      status: "draft",
    });

    res.status(201).json(article);
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      message: error.code === 11000 ? "Article slug already exists." : error.message,
    });
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (
      article.author.toString() !== req.user._id.toString() &&
      !["admin", "editor"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (article.status === "published" && req.user.role !== "admin") {
      return res.status(400).json({
        message: "Published articles must be returned to an editable workflow before editing.",
      });
    }

    const allowed = [
      "title", "slug", "summary", "body", "featuredImage", "category", "tags",
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) article[key] = req.body[key];
    }

    await article.save();
    res.json({ message: "Article updated.", article });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const submitArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (article.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the author can submit this article." });
    }

    if (!["draft", "changes_requested"].includes(article.status)) {
      return res.status(400).json({ message: "Article cannot be submitted in its current state." });
    }

    article.status = "submitted";
    await article.save();

    res.json({ message: "Article submitted for review.", article });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found." });
    }

    if (
      article.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (article.status === "published" && req.user.role !== "admin") {
      return res.status(400).json({
        message: "Only an admin can remove a published article.",
      });
    }

    await article.deleteOne();
    res.json({ message: "Article deleted." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  submitArticle,
  deleteArticle,
};
