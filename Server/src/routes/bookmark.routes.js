const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js"); // adjust path to your project
const {
    addBookmark,
    getBookmarks,
    removeBookmark,
} = require("../controllers/bookmark.controller.js");

// Every bookmark route needs a logged-in, active user
router.use(authMiddleware);

router.get("/", getBookmarks);                 // GET    /api/bookmarks?page=1&limit=10
router.post("/:articleId", addBookmark);       // POST   /api/bookmarks/:articleId
router.delete("/:articleId", removeBookmark);  // DELETE /api/bookmarks/:articleId

module.exports = router;

// In app.js / server.js:
// const bookmarkRoutes = require("./routes/bookmarkRoutes.js");
// app.use("/api/bookmarks", bookmarkRoutes);