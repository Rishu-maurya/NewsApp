const express = require("express");
const router = express.Router();


const authMiddleware = require("../middlewares/auth.middleware");
const roleCheck = require("../middlewares/rolecheck.middleware");
const { createRoleRequest, getMyRoleRequests, getPendingRoleRequests, reviewRoleRequest } = require("../controllers/rolerequest.controller");


router.post("/", authMiddleware, roleCheck("user"), createRoleRequest);
router.get("/mine", authMiddleware, getMyRoleRequests);
router.get("/pending", authMiddleware, roleCheck("publisher", "admin"), getPendingRoleRequests);
router.patch("/:id", authMiddleware, roleCheck("publisher", "admin"), reviewRoleRequest);

module.exports = router;