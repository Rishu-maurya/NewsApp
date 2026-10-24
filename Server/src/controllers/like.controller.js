
const Like = require("../models/Like");
const Article = require("../models/Article");

const toggleLike = async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.articleId,
      status: "published",
    });

    if (!article) {
      return res.status(404).json({ message: "Published article not found." });
    }

    const existing = await Like.findOne({
      article: article._id,
      user: req.user._id,
    });

    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false, message: "Like removed." });
    }

    await Like.create({
      article: article._id,
      user: req.user._id,
    });

    res.status(201).json({ liked: true, message: "Article liked." });
  } catch (error) {
    if (error.code === 11000) {
      return res.json({ liked: true, message: "Article already liked." });
    }
    res.status(400).json({ message: error.message });
  }
};

const getLikeCount = async (req, res) => {
  try {
    const count = await Like.countDocuments({
      article: req.params.articleId,
    });

    res.json({ articleId: req.params.articleId, likes: count });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { toggleLike, getLikeCount };
