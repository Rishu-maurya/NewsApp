const jwt = require("jsonwebtoken");
const User = require("../models/users");

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (user && user.isActive) {
            req.user = user;
        }
    } catch (error) {
        
    }

    next();
};

module.exports = optionalAuth;