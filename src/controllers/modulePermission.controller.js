import ModuleModel from "../models/Module.model.js";
import ModulePermissionModel from "../models/ModulePermission.model.js";
import ModulePermission from "../models/ModulePermission.model.js";
import Role from "../models/Role.model.js";
import mongoose from "mongoose";


export const getMyPermissions = async (req, res) => {
  try {
    const userRoles = req.user.roleIds; // Logged-in user roles
    // console.log("get the role",req.user)
    const permissions = await ModulePermission.find({ role: { $in: userRoles } })
      .populate("role", "role mrRoleId")
      .lean();

    res.json({ success: true, permissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------- GET ALL PERMISSIONS ------------------- */

export const getAllPermissions = async (req, res) => {
  try {
    const { role } = req.query; // Role ID from frontend
    const userRoles = req.user.roles;

    console.log("gett roles",userRoles)
    const isSuperAdmin = userRoles.includes("SUPER_ADMIN");

    if (!role && isSuperAdmin) {
      return res.status(400).json({ success: false, message: "Role is required" });
    }

    // 1️⃣ Get all modules
    const allModules = await ModuleModel.find({}).lean();

    // 2️⃣ Get existing permissions for this role
    const existingPerms = await ModulePermissionModel.find({ role })
      .lean();

    // 3️⃣ Merge: ensure all modules are represented
    const modulesWithPerms = allModules.map((mod) => {
      const perm = existingPerms.find((p) => p.moduleKey === mod.moduleKey);

      return {
        _id: perm?._id || null,  // null if permission not exist
        moduleKey: mod.moduleKey,
        displayName: mod.displayName,
        permissions: perm
          ? perm.permissions
          : { create: false, read: false, update: false, delete: false },
      };
    });

    res.json({ success: true, permissions: modulesWithPerms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------- CREATE OR UPDATE PERMISSION ------------------- */
export const createOrUpdatePermission = async (req, res) => {
  const {  role, moduleKey, permissions } = req.body;

  try {
    const updated = await ModulePermission.findOneAndUpdate(
      { role, moduleKey }, // check by role + moduleKey
      { permissions },
      { new: true, upsert: true, setDefaultsOnInsert: true } // ✅ upsert = create if not exist
    );
    return res.json({ success: true, permission: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};



export const deletePermission = async (req, res) => {
  try {
    const userRoles = req.user.roles;
    const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
    if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only SUPER_ADMIN can delete permissions" });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid permission ID" });
    }

    const permission = await ModulePermission.findById(id);
    if (!permission) {
      return res.status(404).json({ success: false, message: "Permission not found" });
    }

    await permission.remove();
    res.json({ success: true, message: "Permission deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

