
import { USER_ROLE } from "../constants/enums.js";
import User from "../models/User.model.js";
import { authMiddleware } from "./auth.middleware.js";

export const adminOnly = (req, res, next) => {
  const roles = req.user?.roles;

  if (!roles?.includes(USER_ROLE.SUPER_ADMIN)) {
    return res.status(403).json({ message: "Admin only access" });
  }

  next();
};


export const adminAndSuperAdmin = (req, res, next) => {
  const roles = req.user?.roles || [];

  console.log("get the roles",roles)

  const allowedRoles = [
    USER_ROLE.SUPER_ADMIN,
    USER_ROLE.ADMIN,
  ];

  const hasAccess = roles.some((role) =>
    allowedRoles.includes(role)
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: "Admin access only",
    });
  }

  next();
};

/** Allow first admin bootstrap when DB has no users; otherwise require admin auth. */
export const bootstrapOrAdmin = async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      return next();
    }
    return authMiddleware(req, res, () => adminAndSuperAdmin(req, res, next));
  } catch (err) {
    return res.status(500).json({ success: false, message: "Registration check failed" });
  }
};