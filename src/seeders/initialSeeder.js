import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import RoleModel from "../models/Role.model.js";
import UserModel from "../models/User.model.js";
import ModuleModel from "../models/Module.model.js";
import ModulePermissionModel from "../models/ModulePermission.model.js";

import { USER_ROLE, MODULE_KEY } from "../constants/enums.js";
import { config } from "../config/config.js";



export const runInitialSeeder = async () => {
  console.log("🌱 Seeder Started...");

  /* --------------------------------------------------
     1️⃣ CREATE ROLES
  -------------------------------------------------- */
  const roleDocs = {};

  for (const roleName of Object.values(USER_ROLE)) {
    let role = await RoleModel.findOne({ role: roleName });

    if (!role) {
      role = await RoleModel.create({
        role: roleName,
        description: `${roleName} role`,
      });
      console.log(`✅ Role created: ${roleName}`);
    } else {
      console.log(`ℹ️ Role exists: ${roleName}`);
    }

    roleDocs[roleName] = role;
  }

  /* --------------------------------------------------
     2️⃣ CREATE ONLY ONE SUPER ADMIN
  -------------------------------------------------- */
  let superAdmin = await UserModel.findOne({
    roles: roleDocs[USER_ROLE.SUPER_ADMIN]._id,
  });

  const passwordHash = await bcrypt.hash(config.password, 12);

  if (!superAdmin) {
    superAdmin = await UserModel.create({
      fullName: config.fullName,
      mobile: config.mobile,
      email: config.email,
      passwordHash,
      roles: [roleDocs[USER_ROLE.SUPER_ADMIN]._id],
      isBlocked: false,
    });

    console.log("✅ Super Admin created");
  } else {
    superAdmin.fullName = config.fullName;
    superAdmin.mobile = config.mobile;
    superAdmin.email = config.email;
    superAdmin.passwordHash = passwordHash;
    superAdmin.isBlocked = false;
    if (!superAdmin.roles?.length) {
      superAdmin.roles = [roleDocs[USER_ROLE.SUPER_ADMIN]._id];
    }
    await superAdmin.save();
    console.log("✅ Super Admin credentials synced from env");
  }

  /* --------------------------------------------------
     3️⃣ CREATE MODULES
  -------------------------------------------------- */
  const moduleDocs = {};

  for (const key of Object.values(MODULE_KEY)) {
    let mod = await ModuleModel.findOne({ moduleKey: key });

    if (!mod) {
      mod = await ModuleModel.create({
        moduleKey: key,
        displayName: key.replace(/_/g, " "),
        description: `${key} module`,
        createdBy: superAdmin._id,
      });

      console.log(`✅ Module created: ${key}`);
    } else {
      console.log(`ℹ️ Module exists: ${key}`);
    }

    moduleDocs[key] = mod;
  }

  /* --------------------------------------------------
     4️⃣ SUPER ADMIN → FULL PERMISSION
  -------------------------------------------------- */
  for (const key of Object.values(MODULE_KEY)) {
    const exists = await ModulePermissionModel.findOne({
      role: roleDocs[USER_ROLE.SUPER_ADMIN]._id,
      moduleKey: key,
    });

    if (!exists) {
      await ModulePermissionModel.create({
        role: roleDocs[USER_ROLE.SUPER_ADMIN]._id,
        moduleKey: key,
        permissions: {
          create: true,
          read: true,
          update: true,
          delete: true,
        },
      });

      console.log(`✅ Permission: SUPER_ADMIN → ${key}`);
    } else {
      console.log(`ℹ️ Permission exists: SUPER_ADMIN → ${key}`);
    }
  }

  console.log("🎉 Seeder Completed Successfully");
};