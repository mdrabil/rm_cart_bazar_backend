// middlewares/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    /* ================= TOKEN CHECK ================= */
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing"
      });
    }

    const token = authHeader.split(" ")[1];

    /* ================= VERIFY TOKEN ================= */
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    /* ================= GET USER ================= */
    const user = await User.findById(decoded.userId)
      .populate("roles", "role")
      .select("-passwordHash -refreshToken")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "User is blocked"
      });
    }

    /* ================= ROLE VALIDATION ================= */
  const roleNames = (user.roles || []).map(r =>
  r.role?.trim().toUpperCase()
);

console.log("get the rolesname in auth",roleNames)

const roleIds = user.roles?.map(r => r._id) || [];

if (!roleNames.length) {
  return res.status(403).json({
    success: false,
    message: "User has no roles assigned"
  });
}

req.user = {
  ...user,
  _id: user._id,
  roles: roleNames, // CLEAN ROLES
  roleIds
};


    return next();

  } catch (err) {
    console.error("AUTH MIDDLEWARE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Authentication failed"
    });
  }
};
