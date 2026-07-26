import mongoose from "mongoose";
import UserPermission from "../../models/UserPermission.model.js";
import ModulePermission from "../../models/ModulePermission.model.js";
import User from "../../models/User.model.js";
import ModuleModel from "../../models/Module.model.js";
import { MODULE_KEY } from "../../constants/enums.js";

const ACTIONS = ["create", "read", "update", "delete"];

const normalizePermissions = (permissions = {}) => ({
  create: Boolean(permissions.create),
  read: Boolean(permissions.read),
  update: Boolean(permissions.update),
  delete: Boolean(permissions.delete),
});

const hasAnyGrant = (permissions) =>
  ACTIONS.some((action) => permissions?.[action] === true);

/** OR-merge ModulePermission rows for a user's roles, keyed by moduleKey */
async function getRolePermissionMap(roleIds = []) {
  if (!roleIds?.length) return {};

  const rolePerms = await ModulePermission.find({
    role: { $in: roleIds },
  }).lean();

  const map = {};
  for (const row of rolePerms) {
    if (!map[row.moduleKey]) {
      map[row.moduleKey] = {
        create: false,
        read: false,
        update: false,
        delete: false,
      };
    }
    for (const action of ACTIONS) {
      map[row.moduleKey][action] =
        map[row.moduleKey][action] || Boolean(row.permissions?.[action]);
    }
  }
  return map;
}

/**
 * True when every requested `true` action is already granted by role.
 * Creating a UserPermission would be redundant.
 */
function isFullyCoveredByRole(requested, rolePerm) {
  if (!rolePerm) return false;
  const requestedTrue = ACTIONS.filter((a) => requested[a] === true);
  if (requestedTrue.length === 0) return true;
  return requestedTrue.every((a) => rolePerm[a] === true);
}

async function loadUserOrFail(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error("Invalid user ID");
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId)
    .populate("roles", "role mrRoleId")
    .select("fullName email mobile roles mrId isBlocked")
    .lean();

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return user;
}

/* ------------------- LIST ------------------- */
export const listUserPermissions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const { search, userId, moduleKey } = req.query;

    const filter = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = userId;
    }

    if (moduleKey && Object.values(MODULE_KEY).includes(moduleKey)) {
      filter.moduleKey = moduleKey;
    }

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      const matchedUsers = await User.find({
        $or: [
          { fullName: regex },
          { email: regex },
          { mobile: regex },
          { mrId: regex },
        ],
      })
        .select("_id")
        .lean();

      const matchedIds = matchedUsers.map((u) => u._id);

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        const included = matchedIds.some((id) => String(id) === String(userId));
        if (!included) {
          return res.status(200).json({
            success: true,
            total: 0,
            page,
            limit,
            permissions: [],
          });
        }
        filter.userId = userId;
      } else {
        filter.userId = { $in: matchedIds };
      }
    }

    const total = await UserPermission.countDocuments(filter);
    const permissions = await UserPermission.find(filter)
      .populate({
        path: "userId",
        select: "fullName email mobile mrId roles",
        populate: { path: "roles", select: "role mrRoleId" },
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const modules = await ModuleModel.find({}).select("moduleKey displayName").lean();
    const moduleNameMap = Object.fromEntries(
      modules.map((m) => [m.moduleKey, m.displayName || m.moduleKey])
    );

    const enriched = permissions.map((row) => ({
      ...row,
      displayName: moduleNameMap[row.moduleKey] || row.moduleKey,
      user: row.userId,
    }));

    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      permissions: enriched,
    });
  } catch (err) {
    console.error("listUserPermissions error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load user permissions",
    });
  }
};

/* ------------------- GET ROLE COVERAGE (for form UX) ------------------- */
export const getUserRoleCoverage = async (req, res) => {
  try {
    const { userId, moduleKey } = req.query;
    const user = await loadUserOrFail(userId);

    if (moduleKey && !Object.values(MODULE_KEY).includes(moduleKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid moduleKey",
      });
    }

    const roleIds = (user.roles || []).map((r) => r._id || r);
    const rolePermMap = await getRolePermissionMap(roleIds);

    if (moduleKey) {
      return res.status(200).json({
        success: true,
        userId: user._id,
        moduleKey,
        rolePermissions: rolePermMap[moduleKey] || {
          create: false,
          read: false,
          update: false,
          delete: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      userId: user._id,
      rolePermissions: rolePermMap,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to load role coverage",
    });
  }
};

/* ------------------- CREATE ------------------- */
export const createUserPermission = async (req, res) => {
  try {
    const { userId, moduleKey, permissions } = req.body || {};

    if (!userId || !moduleKey) {
      return res.status(400).json({
        success: false,
        message: "userId and moduleKey are required",
      });
    }

    if (!Object.values(MODULE_KEY).includes(moduleKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid moduleKey",
      });
    }

    const normalized = normalizePermissions(permissions);

    if (!hasAnyGrant(normalized)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one permission (create / read / update / delete)",
      });
    }

    const user = await loadUserOrFail(userId);
    const roleIds = (user.roles || []).map((r) => r._id || r);
    const rolePermMap = await getRolePermissionMap(roleIds);
    const rolePerm = rolePermMap[moduleKey];

    if (isFullyCoveredByRole(normalized, rolePerm)) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_GRANTED_BY_ROLE",
        message:
          "This permission is already granted through the assigned role.",
        rolePermissions: rolePerm,
      });
    }

    const existing = await UserPermission.findOne({ userId, moduleKey }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "A custom permission for this user and module already exists. Edit it instead.",
        permissionId: existing._id,
      });
    }

    const created = await UserPermission.create({
      userId,
      moduleKey,
      permissions: normalized,
    });

    const populated = await UserPermission.findById(created._id)
      .populate({
        path: "userId",
        select: "fullName email mobile mrId roles",
        populate: { path: "roles", select: "role mrRoleId" },
      })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Custom user permission created",
      permission: populated,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A custom permission for this user and module already exists. Edit it instead.",
      });
    }
    console.error("createUserPermission error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to create user permission",
    });
  }
};

/* ------------------- UPDATE ------------------- */
export const updateUserPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions, moduleKey } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permission ID",
      });
    }

    const doc = await UserPermission.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "User permission not found",
      });
    }

    const nextModuleKey = moduleKey || doc.moduleKey;
    if (!Object.values(MODULE_KEY).includes(nextModuleKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid moduleKey",
      });
    }

    const normalized = normalizePermissions(permissions ?? doc.permissions);

    if (!hasAnyGrant(normalized)) {
      return res.status(400).json({
        success: false,
        message: "Select at least one permission (create / read / update / delete)",
      });
    }

    const user = await loadUserOrFail(doc.userId);
    const roleIds = (user.roles || []).map((r) => r._id || r);
    const rolePermMap = await getRolePermissionMap(roleIds);
    const rolePerm = rolePermMap[nextModuleKey];

    if (isFullyCoveredByRole(normalized, rolePerm)) {
      return res.status(400).json({
        success: false,
        code: "ALREADY_GRANTED_BY_ROLE",
        message:
          "This permission is already granted through the assigned role.",
        rolePermissions: rolePerm,
      });
    }

    if (nextModuleKey !== doc.moduleKey) {
      const clash = await UserPermission.findOne({
        userId: doc.userId,
        moduleKey: nextModuleKey,
        _id: { $ne: doc._id },
      }).lean();
      if (clash) {
        return res.status(409).json({
          success: false,
          message:
            "A custom permission for this user and module already exists.",
        });
      }
      doc.moduleKey = nextModuleKey;
    }

    doc.permissions = normalized;
    await doc.save();

    const populated = await UserPermission.findById(doc._id)
      .populate({
        path: "userId",
        select: "fullName email mobile mrId roles",
        populate: { path: "roles", select: "role mrRoleId" },
      })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Custom user permission updated",
      permission: populated,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A custom permission for this user and module already exists.",
      });
    }
    console.error("updateUserPermission error:", err);
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update user permission",
    });
  }
};

/* ------------------- DELETE ------------------- */
export const deleteUserPermission = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid permission ID",
      });
    }

    const deleted = await UserPermission.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User permission not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Custom user permission deleted",
    });
  } catch (err) {
    console.error("deleteUserPermission error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete user permission",
    });
  }
};

/* ------------------- BULK DELETE ------------------- */
export const bulkDeleteUserPermissions = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (!validIds.length) {
      return res.status(400).json({
        success: false,
        message: "No valid permission IDs provided",
      });
    }

    const result = await UserPermission.deleteMany({
      _id: { $in: validIds },
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} custom permission(s) deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error("bulkDeleteUserPermissions error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to bulk delete user permissions",
    });
  }
};
