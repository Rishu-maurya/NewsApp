const mongoose = require("mongoose");
const User = require("../models/user");
const RoleRequest = require("../models/rolerequest");

const ALLOWED_ROLES = ["journalist", "editor", "publisher"];

const CAN_REVIEW = {
    publisher: ["journalist", "editor"],
    admin: ["publisher"],
};

const createRoleRequest = async (req, res) => {
    try {
        const { requestedRole, organization, proofLink, message } = req.body;

        if (!ALLOWED_ROLES.includes(requestedRole)) {
            return res.status(400).json({
                success: false,
                message: "Choose journalist, editor or publisher",
            });
        }

        if (typeof organization !== "string" || !organization.trim()) {
            return res.status(400).json({
                success: false,
                message: "Organization is required",
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
            organization: organization.trim(),
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
            .select("requestedRole organization status reviewNote createdAt")
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
            requestedRole: { $in: CAN_REVIEW[req.user.role] },
        })
            .populate("user", "fullName email")
            .select("user requestedRole organization proofLink message createdAt")
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
    try {
        const { id } = req.params;
        const { decision, reviewNote } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid request ID",
            })
        }

        if (!["approved", "rejected"].includes(decision)) {
            return res.status(400).json({
                success: false,
                message: "Decision must be Approved or Rejected",
            });
        }

        if (decision === "rejected" && (typeof reviewNote !== "string" || !reviewNote.trim())) {
            return res.status(400).json({
                success: false,
                message: "Reason is reuired to request",
            })
        }

        const request = await RoleRequest.findById(id);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        if (!CAN_REVIEW[req.user.role].includes(request.requestedRole)) {
            return res.status(403).json({
                success: false,
                message: "You cannot review this request",
            });
        }

        const updated = await RoleRequest.findOneAndUpdate(
            { _id: id, status: "pending" },
            {
                status: decision,
                reviewedBy: req.user._id,
                reviewNote: decision === "rejected" ? reviewNote.trim() : undefined,
            },
            { new: true }
        );

        if (!updated) {
            return res.status(400).json({
                success: false,
                message: "This requrst was already reviewed",
            })
        }

        if (decision === "approved") {
            await User.findByIdAndUpdate(request.user, { role: request.requestedRole })
        }

        return res.status(200).json({
            success: true,
            message: `Reqest ${decision}`,
            data: updated,
        })
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors)[0].message;
            return res.status(409).json({
                success: false, message
            })
        }

        console.error("Review Role Request Error:", error)
         res.status(500).json({
                success: false,
                message: "Sever error"
            })
    }
}


module.exports = { createRoleRequest, getMyRoleRequests, getPendingRoleRequests, reviewRoleRequest };