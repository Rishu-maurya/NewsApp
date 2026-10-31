const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js");
const roleCheck = require("../middlewares/rolecheck.middleware.js");
const {
    getMyArticles,
    submitArticle,
    getAssignedArticles,
    editArticle,
    completeEditing,
} = require("../controllers/workflow.controller.js");

router.use(authMiddleware);

// ----- journalist -----
router.get("/my-articles", roleCheck("journalist"), getMyArticles);
router.patch("/articles/:id/submit", roleCheck("journalist"), submitArticle);

// ----- editor -----
router.get("/editor/articles", roleCheck("editor"), getAssignedArticles);
router.patch("/editor/articles/:id", roleCheck("editor"), editArticle);
router.patch("/editor/articles/:id/complete", roleCheck("editor"), completeEditing);

module.exports = router;