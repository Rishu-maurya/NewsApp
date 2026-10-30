const mongoose = require("mongoose");
const User = require("../models/users.js");

// ---------- constants (must match the schema) ----------
const ROLES = ["user", "journalist", "editor", "admin"];
const PHONE_REGEX = /^[6-9]\d{9}$/;

const invalidId = (res) =>
    res.status(400).json({ success: false, message: "Invalid user ID" });

// ---------- 1) GET ALL USERS ----------
// GET /api/users?page=1&limit=10&role=editor&isActive=false&search=john   (admin only)
const getUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
        const { role, isActive, search } = req.query;

        const filter = {};

        if (role) {
            if (typeof role !== "string" || !ROLES.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: `Role must be one of: ${ROLES.join(", ")}`,
                });
            }
            filter.role = role;
        }
        if (isActive === "true") filter.isActive = true;
        if (isActive === "false") filter.isActive = false;

        if (search) {
            if (typeof search !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Search must be text",
                });
            }
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { fullName: { $regex: escaped, $options: "i" } },
                { email: { $regex: escaped, $options: "i" } },
            ];
        }

        // password has select:false in the schema, so it is never returned
        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            count: users.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            data: users,
        });
    } catch (error) {
        console.error("Get Users Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 2) GET USER BY ID ----------
// GET /api/users/:id   (admin, or the user themselves)
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const isSelf = req.user._id.toString() === id;
        if (req.user.role !== "admin" && !isSelf) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to view this user",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error("Get User Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 3) UPDATE OWN PROFILE ----------
// PUT /api/users/profile   body: { fullName?, phone? }
const updateProfile = async (req, res) => {
    try {
        const { fullName, phone } = req.body || {};
        const set = {};
        const unset = {};

        if (fullName !== undefined) {
            if (typeof fullName !== "string" || !fullName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty",
                });
            }
            set.fullName = fullName.trim();
        }

        if (phone !== undefined) {
            if (typeof phone !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid 10 digit phone number",
                });
            }
            const cleanPhone = phone.trim();
            if (cleanPhone === "") {
                unset.phone = ""; // an empty string clears the phone number
            } else if (!PHONE_REGEX.test(cleanPhone)) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid 10 digit phone number",
                });
            } else {
                set.phone = cleanPhone;
            }
        }

        if (Object.keys(set).length === 0 && Object.keys(unset).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide a name or phone number to update",
            });
        }

        const update = {};
        if (Object.keys(set).length) update.$set = set;
        if (Object.keys(unset).length) update.$unset = unset;

        // email, password, role and isActive are deliberately not updatable here
        const updatedUser = await User.findByIdAndUpdate(req.user._id, update, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Update Profile Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 4) UPDATE USER ROLE ----------
// PATCH /api/users/:id/role   body: { role }   (admin only)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const { role } = req.body || {};

        if (typeof role !== "string" || !ROLES.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Role must be one of: ${ROLES.join(", ")}`,
            });
        }

        // Stops an admin from demoting themselves and locking everyone out
        if (req.user._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role",
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { role } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: user,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Update User Role Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ---------- 5) UPDATE USER STATUS (block / unblock) ----------
// PATCH /api/users/:id/status   body: { isActive: true | false }   (admin only)
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return invalidId(res);

        const { isActive } = req.body || {};

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive must be true or false",
            });
        }

        // Stops an admin from blocking their own account
        if (req.user._id.toString() === id) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own status",
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { isActive } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: isActive ? "User unblocked" : "User blocked",
            data: user,
        });
    } catch (error) {
        console.error("Update User Status Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateProfile,
    updateUserRole,
    updateUserStatus,
};