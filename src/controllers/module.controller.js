// controllers/module.controller.js

import Module from "../models/Module.model.js";
import ModulePermissionModel from "../models/ModulePermission.model.js";

/* ================= CREATE MODULE ================= */
// export const createModule = async (req, res) => {
//   try {
//     const { moduleKey, displayName, description } = req.body;

//     const exist = await Module.findOne({ moduleKey });

//     if (exist) {
//       return res.status(400).json({
//         success: false,
//         message: "Module already exists",
//       });
//     }

//     const module = await Module.create({
//       moduleKey,
//       displayName,
//       description,
//       createdBy: req.user?._id,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Module created successfully",
//       module,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };


import ModulePermission from "../models/ModulePermission.model.js";
import Role from "../models/Role.model.js";
import { USER_ROLE } from "../constants/enums.js";
import RoleModel from "../models/Role.model.js";

export const createModule = async (req, res) => {
  try {
    const { moduleKey, displayName, description } = req.body;

    const exist = await Module.findOne({ moduleKey });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Module already exists",
      });
    }

    const module = await Module.create({
      moduleKey,
      displayName,
      description,
      createdBy: req.user?._id,
    });

    /* ================= AUTO PERMISSION FOR SUPER ADMIN ================= */

    const superAdminRole = await RoleModel.findOne({
      role: USER_ROLE.SUPER_ADMIN,
    });

    if (superAdminRole) {
      const existPermission = await ModulePermission.findOne({
        role: superAdminRole._id,
        moduleKey: moduleKey,
      });

      if (!existPermission) {
        await ModulePermission.create({
          role: superAdminRole._id,
          moduleKey: moduleKey,
          permissions: {
            create: true,
            read: true,
            update: true,
            delete: true,
          },
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Module created successfully",
      module,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= GET ALL MODULES ================= */
export const getModules = async (req, res) => {
  try {
    const modules = await Module.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Modules fetched successfully",
      modules,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ================= DELETE MODULE ================= */
export const deleteModule = async (req, res) => {
  try {
    /* ================= AUTH CHECK ================= */
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please login first",
      });
    }

    const { id } = req.params;

    /* ================= MODULE EXIST CHECK ================= */
    const module = await Module.findById(id);

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    /* ================= DELETE PERMISSIONS ================= */
    await ModulePermissionModel.deleteMany({
      moduleKey: module.moduleKey,
    });

    /* ================= DELETE MODULE ================= */
    await Module.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Module and related permissions deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};