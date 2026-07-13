


// middlewares/checkPermission.js
import ModulePermission from "../models/ModulePermission.model.js";
import UserPermission from "../models/UserPermission.model.js";

export const checkPermission = (moduleKey, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      // console.log("get userdata",user)
      //    console.log("get the rolePrem",moduleKey)
      if (!user)
        return res.status(401).json({ success:false, message:"Unauthenticated" });

      /* 🔥 SUPER ADMIN FULL ACCESS */
      if (user.roles.includes("SUPER_ADMIN")) {
        return next();
      }

      /* 1️⃣ USER OVERRIDE PERMISSION */
      const userPerm = await UserPermission.findOne({
        userId: user._id,
        moduleKey,
        [`permissions.${action}`]: true
      }).lean();

      if (userPerm) return next();

      /* 2️⃣ ROLE BASED PERMISSION */
       console.log("get the rolePrem",moduleKey)
      const rolePerm = await ModulePermission.findOne({
        role: { $in: user.roleIds },
        moduleKey,
        [`permissions.${action}`]: true
      }).lean();

      console.log("get the rolePrem",rolePerm)

      if (!rolePerm) {
        return res.status(403).json({
          success: false,
          message: "Permission denied"
        });
      }

      return next();

    } catch (err) {
      console.error("RBAC ERROR:", err);
      return res.status(500).json({
        success:false,
        message:"Permission system failed"
      });
    }
  };
};
