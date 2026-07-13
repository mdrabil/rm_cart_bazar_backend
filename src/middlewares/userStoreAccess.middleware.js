


// import StoreStaff from "../models/StoreStaff.model.js";
// import Store from "../models/Store.model.js";

// export const storeAccessForUser = async (req, res, next) => {
//   try {
//     const user = req.user;

//     if (!user || !user.roles || !user.roles.length) {
//       return res.status(403).json({ message: "User has no roles assigned" });
//     }

//     // Super Admin / Global Support / Sales Admin → full access
//     const bypassRoles = ["ADMIN", "GLOBAL_SUPPORT",AUTHOR, "SALES_ADMIN"];
//     if (user.roles.some((r) => bypassRoles.includes(r))) {
//       req.accessibleStores = null; // null means full access
//       return next();
//     }

//     // USER → only active staff stores
//     if (user.roles.includes("USER")) {
//       const stores = await StoreStaff.find({
//         user: user._id,
//         isActive: true,
//       }).select("store -_id");

//       req.accessibleStores = stores.map((s) => s.store);
//       req.staffRole = staffStores.map((s) => s.role);
//       return next();
//     }

//     // VENDOR → only stores they own
//     if (user.roles.includes("VENDOR")) {
//       const stores = await Store.find({ owner: user._id }).select("_id");
//       req.accessibleStores = stores.map((s) => s._id);
//       return next();
//     }

//     // Default → deny access
//     return res.status(403).json({ message: "Store access denied" });
//   } catch (err) {
//     console.error("storeAccessForUser middleware:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };


import StoreStaff from "../models/StoreStaff.model.js";
import Store from "../models/Store.model.js";

export const storeAccessForUser = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user || !user.roles || !user.roles.length) {
      return res.status(403).json({ message: "User has no roles assigned" });
    }

    // Super Admin / Global Support / Sales Admin → full access
    const bypassRoles = ["ADMIN", "GLOBAL_SUPPORT", "AUTHOR", "SALES_ADMIN"];
    if (user.roles.some((r) => bypassRoles.includes(r))) {
      req.accessibleStores = null; // null means full access
      req.staffRole = "FULL_ACCESS";
      return next();
    }

    // USER → only active staff stores
    if (user.roles.includes("USER")) {
      const staffStores = await StoreStaff.find({
        user: user._id,
        isActive: true,
      }).select("store role -_id");

      req.accessibleStores = staffStores.map((s) => s.store);
      req.staffRole = staffStores.map((s) => s.role); // Array of roles for each store
      return next();
    }

    // VENDOR → only stores they own
    if (user.roles.includes("VENDOR")) {
      const vendorStores = await Store.find({ owner: user._id }).select("_id");
      req.accessibleStores = vendorStores.map((s) => s._id);
      req.staffRole = "OWNER";
      return next();
    }

    // Default → deny access
    return res.status(403).json({ message: "Store access denied" });
  } catch (err) {
    console.error("storeAccessForUser middleware:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

