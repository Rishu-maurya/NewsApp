const express = require('express');
const router = express.Router();

const { registerUser, loginUser, getMe } = require("../controllers/auth.controller")

const authMiddleware = require('../middlewares/auth.middleware')
const roleCheck = require('../middlewares/rolecheck.middleware')

router.post("/register", registerUser);
router.post("/login", loginUser);

// temprory test

router.get('/me', authMiddleware, getMe)

router.get('/admin-test', authMiddleware, roleCheck('admin'), (req, res) => {
    res.status(200).json({
        success: true, message: 'Welcom Admin'
    })
})

module.exports = router;

