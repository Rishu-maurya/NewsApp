const User = require("../models/users.js");
const RoleRequest = require("../models/rolerequest.js");
const generateToken = require("../utils/generateToken.js");
const bcrypt = require("bcryptjs");

const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, phone, role = "reader", organization } = req.body || {};
        const cleanName = typeof fullName === "string" ? fullName.trim() : "";
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const cleanOrganization = typeof organization === "string" ? organization.trim() : "";
        const requestedRoles = ["journalist", "editor", "publisher"];

        if (!cleanName || !cleanEmail || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }
        if (role !== "reader" && !requestedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Choose reader, journalist, editor or publisher",
            });
        }
        if (role !== "reader" && !cleanOrganization) {
            return res.status(400).json({
                success: false,
                message: "Organization is required for a role request",
            });
        }

        const userExists = await User.findOne({ email: cleanEmail });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);          // (3)

        const newUser = await User.create({
            fullName: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            ...(typeof phone === "string" && phone.trim() ? { phone: phone.trim() } : {}),
            role: "user",                                              // (4)
        });

        let roleRequest;
        if (role !== "reader") {
            try {
                roleRequest = await RoleRequest.create({
                    user: newUser._id,
                    requestedRole: role,
                    organization: cleanOrganization,
                });
            } catch (error) {
                await User.deleteOne({ _id: newUser._id });
                throw error;
            }
        }

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
            roleRequest: roleRequest ? {
                id: roleRequest._id,
                requestedRole: roleRequest.requestedRole,
                status: roleRequest.status,
            } : null,
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
        const { email, password } = req.body || {};
        const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!cleanEmail || typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email: cleanEmail }).select("+password");
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