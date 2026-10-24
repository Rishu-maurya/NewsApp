
const Bookmark = require("../models/Bookmark");
const Article = require("../models/Article");

const addBookmark = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.articleId,
      status: "published",
    });

    if (!article) {
      return res.status(404).json({ message: "Published article not found." });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { article: article._id, user: req.user._id },
      { $setOnInsert: { article: article._id, user: req.user._id } },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Article bookmarked.",
      bookmark,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: "article",
        match: { status: "published" },
        populate: [
          { path: "author", select: "name" },
          { path: "category", select: "name slug" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json(bookmarks.filter((item) => item.article));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      article: req.params.articleId,
      user: req.user._id,
    });

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found." });
    }

    res.json({ message: "Bookmark removed." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { addBookmark, getBookmarks, removeBookmark };
