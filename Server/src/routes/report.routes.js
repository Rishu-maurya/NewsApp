const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js"); 
const adminOnly = require("../middlewares/admin.middleware.js");
const {
    createReport,
    getReports,
    updateReport,
} = require("../controllers/report.controller.js");

// Logged-in users
router.post("/comments/:commentId/reports", authMiddleware, createReport);

// Admin only
router.get("/reports", authMiddleware, adminOnly, getReports);
router.patch("/reports/:id", authMiddleware, adminOnly, updateReport);

module.exports = router;

