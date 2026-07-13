
import { getUserStoreRole } from "../utils/accessHelper.js";


export const allowStoreRoles = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
const storeId =
  req.body.store ||
  req.query.store ||
  req.params.storeId ||
  req.params.id; // ✅ add this

      if (!storeId) {
        return res.status(400).json({
          success: false,
          message: "Store ID required",
        });
      }

      const role = await getUserStoreRole(req.user, storeId);

      // ❌ No access
      if (!role) {
        return res.status(403).json({
          success: false,
          message: "No store access",
        });
      }

      // ✅ FULL ACCESS → bypass all checks
      if (role === "FULL_ACCESS") {
        req.storeRole = role;
        req.storeId = storeId;
        return next();
      }

      // ❌ Role not allowed
      if (allowedRoles.length && !allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Only ${allowedRoles.join(", ")} can perform this action`,
        });
      }

      // ✅ Allowed
      req.storeRole = role;
      req.storeId = storeId;

      next();
    } catch (err) {
      console.error("allowStoreRoles error:", err);
      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
};



export const allowRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const userRoles = req.user.roles || [];

      const hasAccess = userRoles.some(role =>
        allowedRoles.includes(role)
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied: insufficient role"
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Authorization error"
      });
    }
  };
};
