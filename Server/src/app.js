const express = require('express');
const cors = require('cors');
const authRoutes = require("./routes/auth.routes")
const categoryRoutes = require("./routes/category.routes");
const articalRoutes = require("./routes/article.routes")
const bookmarkRoutes = require("./routes/bookmark.routes");


const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
    })
})

app.use('/api/auth', authRoutes)
app.use("/api/categories", categoryRoutes);
app.use("/api/article", articalRoutes)
app.use("/api/bookmarks", bookmarkRoutes);


module.exports = app;