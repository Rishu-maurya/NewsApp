const mongoose = require("mongoose");
const User = require("../models/users");
const RoleRequest = require("../models/rolerequest");

const ALLOWED_ROLES = ["journalist", "editor", "publisher"];

const CAN_REVIEW = {
    publisher: ["journalist", "editor"],
    admin: ["publisher"],
};

const createRoleRequest = async (req, res) => {
    try {
        const { requestedRole, proofLink, message } = req.body;

        if (!ALLOWED_ROLES.includes(requestedRole)) {
            return res.status(400).json({
                success: false,
                message: "Choose journalist, editor or publisher",
            });
        }


        if (proofLink !== undefined && (typeof proofLink !== "string" || !proofLink.startsWith("http"))) {
            return res.status(400).json({
                success: false,
                message: "Proof link must start with http",
            });
        }

        const alreadyPending = await RoleRequest.exists({ user: req.user._id, status: "pending" });
        if (alreadyPending) {
            return res.status(409).json({
                success: false,
                message: "You already have a pending request",
            });
        }

        const request = await RoleRequest.create({
            user: req.user._id,
            requestedRole,
            proofLink,
            message,
        });

        return res.status(201).json({
            success: true,
            message: "Request sent for verification",
            data: request,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You already have a pending request",
            });
        }
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(400).json({ success: false, message });
        }
        console.error("Create Role Request Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const getMyRoleRequests = async (req, res) => {
    try {
        const requests = await RoleRequest.find({ user: req.user._id })
            .select("requestedRole status reviewNote createdAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error) {
        console.error("Get My Role Requests Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


const getPendingRoleRequests = async (req, res) => {
    try {
        const requests = await RoleRequest.find({
            status: "pending",
            requestedRole: { $in: CAN_REVIEW[req.user.role] || [] },
        })
            .populate("user", "fullName email")
            .select("user requestedRole proofLink message createdAt")
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error) {
        console.error("Get Pending Role Requests Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


const reviewRoleRequest = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;
        const { decision, reviewNote } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID",
            });
        }

        if (!["approved", "rejected"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be approved or rejected",
            });
        }

        if (
            decision === "rejected" &&
            (typeof reviewNote !== "string" || !reviewNote.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Reason is required for rejection",
            });
        }

        let updatedRequest;

        await session.withTransaction(async () => {
            const request = await RoleRequest.findById(id).session(session);

            if (!request) {
                const error = new Error("Request not found");
                error.statusCode = 404;
                throw error;
            }

            if (request.status !== "pending") {
                const error = new Error("Request already reviewed");
                error.statusCode = 409;
                throw error;
            }

            const allowedRoles = CAN_REVIEW[req.user.role] || [];

            if (!allowedRoles.includes(request.requestedRole)) {
                const error = new Error("You cannot review this request");
                error.statusCode = 403;
                throw error;
            }

            // Update User role only when approved
            if (decision === "approved") {
                const user = await User.findByIdAndUpdate(
                    request.user,
                    { $set: { role: request.requestedRole } },
                    {
                        new: true,
                        runValidators: true,
                        session,
                    }
                );

                if (!user) {
                    const error = new Error("Requested user not found");
                    error.statusCode = 404;
                    throw error;
                }
            }

            // Update RoleRequest
            request.status = decision;
            request.reviewedBy = req.user._id;
            request.reviewNote =
                decision === "rejected" ? reviewNote.trim() : "";

            await request.save({ session });

            updatedRequest = request;
        });

        return res.status(200).json({
            success: true,
            message: `Request ${decision} successfully`,
            data: updatedRequest,
        });

    } catch (error) {
        console.error("Review Role Request Error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Server error",
        });

    } finally {
        await session.endSession();
    }
};


module.exports = { createRoleRequest, getMyRoleRequests, getPendingRoleRequests, reviewRoleRequest };