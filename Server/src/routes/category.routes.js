const express = require("express");
const router = express.Router();
const { createCategory, getCategories, updateCategory, deleteCategory } = require("../controllers/category.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/rolecheck.middleware");

router.post("/", authMiddleware, roleCheck("admin"), createCategory);
router.get("/", getCategories);
router.patch("/:id", authMiddleware, roleCheck("admin"), updateCategory);
router.delete("/:id", authMiddleware, roleCheck("admin"), deleteCategory);


module.exports = router;