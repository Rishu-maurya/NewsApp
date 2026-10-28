const express = require("express")
const router = express.Router()

const { createArticle } =require("../controllers/article.controller")
const authMiddleware = require("../middlewares/auth.middleware")
const roleCheack = require("../middlewares/rolecheck.middleware")

router.post("/",authMiddleware,roleCheack("journalist"), createArticle)

module.exports = router