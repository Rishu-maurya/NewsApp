const express = require('express');
const authRoutes = require("./routes/auth.routes")
const categoryRoutes = require("./routes/category.routes");
const articalRoutes = require("./routes/article.routes")

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
    })
})

app.use('/api/auth', authRoutes)
app.use("/api/categories", categoryRoutes);
app.use("/api/create-article", articalRoutes)


module.exports = app;