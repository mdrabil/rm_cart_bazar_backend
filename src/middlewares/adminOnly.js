
import { USER_ROLE } from "../constants/enums.js";

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