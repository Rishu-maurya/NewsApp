<<<<<<< Updated upstream
const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/auth.routes")
const categoryRoutes = require("./routes/category.routes");
const articalRoutes = require("./routes/article.routes")
const bookmarkRoutes = require("./routes/bookmark.routes");
=======
const express = require("express");
const cors = require("cors");
>>>>>>> Stashed changes

const authRoutes = require("./routes/auth.routes.js");
const categoryRoutes = require("./routes/category.routes.js");
const articleRoutes = require("./routes/article.routes.js");
const bookmarkRoutes = require("./routes/bookmark.routes.js");
const commentRoutes = require("./routes/comment.routes.js");
const reportRoutes = require("./routes/report.routes.js");
const likeRoutes = require("./routes/like.routes.js");
const userRoutes = require("./routes/user.routes.js");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
});

// ---------- routes with their own prefix ----------
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
<<<<<<< Updated upstream

=======
app.use("/api/users", userRoutes);

// ---------- routes that define full paths inside the router ----------
// like:    /articles/:articleId/like, /articles/:articleId/likes
// comment: /articles/:articleId/comments, /comments/:id, /comments/:id/moderate
// report:  /comments/:commentId/reports, /reports, /reports/:id
app.use("/api", likeRoutes);
app.use("/api", commentRoutes);
app.use("/api", reportRoutes);


app.use("/api/articles", articleRoutes);


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

app.use((err, req, res, next) => {
    
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON in request body",
        });
    }
    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body too large",
        });
    }
    console.error("Unhandled Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
});
>>>>>>> Stashed changes

module.exports = app;