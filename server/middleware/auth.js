import User from "../models/User.js";
import jwt from "jsonwebtoken";

// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "JWT must be provided" });
    }

    const token = authHeader.split(" ")[1]; // get the actual token

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password"); // fixed: decoded.id

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user; // ✅ attach user to request
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
