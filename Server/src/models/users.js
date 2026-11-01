const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Exclude password from query results by default
    },
    phone: {
        type: String,
        match: [/^[6-9]\d{9}$/, "Enter a valid 10 digit phone number"],
        trim: true,

    },

    role: {
      type: String,
      enum: ["user", "journalist", "editor", "admin", "publisher"],
      default: "user"
    },
    
    isActive:{
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

const Users = mongoose.model("User", userSchema);

module.exports = Users;
