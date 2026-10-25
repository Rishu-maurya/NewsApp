const User = require("../models/users.js");
const generateToken = require("../utils/generateToken.js");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password) {                          // (1)
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }
        if (password.length < 6) {                                       // (2)
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);          // (3)

        const newUser = await User.create({
            fullName, email, password: hashedPassword, phone,
            role: "user",                                              // (4)
        });

        res.status(201).json({
            success: true,
            message: "Registered successfully",
            data: {
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                token: generateToken(newUser._id),
            },
        });
    } catch (error) {
        if (error.code === 11000) {                                      // (5)
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }
        if (error.name === "ValidationError") {                          // (6)
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Register Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked",
            });
        }

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id),
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getMe = (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user,
    })
}


module.exports = { registerUser, loginUser, getMe };