const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware.js");
const publisherOnly = require("../middlewares/rolecheck.middleware.js");
const {
    getPendingRequests,
    approveRequest,
    getStaff,
    deleteStaff,
    updateStaffStatus,
    getArticlesForPublisher,
    decideArticle,
    assignEditor,
    requestChanges,
    publishArticle,
} = require("../controllers/publisher.controller.js");

// Every route here: logged in + publisher (or admin)
router.use(authMiddleware, publisherOnly);

// ----- manage journalists and editors -----
router.get("/requests", getPendingRequests);              // who is waiting for access
router.patch("/requests/:id/approve", approveRequest);    // let them in
router.get("/staff", getStaff);                           // current journalists + editors
router.patch("/staff/:id/status", updateStaffStatus);     // block / unblock
router.delete("/staff/:id", deleteStaff);                 // reject request / remove from database

// ----- manage the news -----
router.get("/articles", getArticlesForPublisher);
router.patch("/articles/:id/decision", decideArticle);          // approve / reject journalist news
router.patch("/articles/:id/assign", assignEditor);             // send to an editor
router.patch("/articles/:id/request-changes", requestChanges);  // send edited work back
router.patch("/articles/:id/publish", publishArticle);          // go live

module.exports = router;