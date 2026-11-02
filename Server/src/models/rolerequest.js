const mongoose = require("mongoose");

const roleRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        requestedRole: {
            type: String,
            enum: ["journalist", "editor", "publisher"],
            required: true,
        },
        organization: {
            type: String,
            required: true, 
            trim: true, 
            maxlength: 100
        },
        proofLink: { 
            type: String, 
            trim: true, 
            maxlength: 300 
        },

        message: {
            type: String, 
            trim: true, 
            maxlength: 500 
        },

        status: {
            type: String,
            enum: ["pending", "approved", "removed"],
            default: "pending",
        },
        reviewedBy: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User" 
        },
        reviewNote: { 
            type: String, 
            trim: true, 
            maxlength: 300 
        },
    },
    { timestamps: true }
);

roleRequestSchema.index(
    { user: 1 },
    { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("RoleRequest", roleRequestSchema);