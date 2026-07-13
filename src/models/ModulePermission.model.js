// models/ModulePermission.model.js

import mongoose from "mongoose";
import { MODULE_KEY } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";

const modulePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },

    mrModulePrms: {
      type: String,
      unique: true,
      index: true,
    },

    moduleKey: {
      type: String,
      enum: Object.values(MODULE_KEY),
      required: true,
      index: true,
    },

    permissions: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// ✅ UNIQUE COMBO
modulePermissionSchema.index({ role: 1, moduleKey: 1 }, { unique: true });


// ✅ save() case
modulePermissionSchema.pre("save", async function (next) {
  if (!this.mrModulePrms) {
    this.mrModulePrms = await generateMRId("MODPRMS", "MODULEPERMISSION");
  }
  next();
});

// ✅ create() internally save use karta hai (covered)

// ✅ insertMany() case
modulePermissionSchema.pre("insertMany", async function (next, docs) {
  for (let doc of docs) {
    if (!doc.mrModulePrms) {
     doc.mrModulePrms = await generateMRId("MODPRMS", "MODULEPERMISSION");
    }
  }
  next();
});

// ✅ findOneAndUpdate / update case (extra safety)
modulePermissionSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (!update.mrModulePrms && !update.$set?.mrModulePrms) {
    const mrId = await generateMRId("MODPRMS", "MODULEPERMISSION");

    this.setUpdate({
      ...update,
      $set: {
        ...update.$set,
        mrModulePrms: mrId,
      },
    });
  }

  next();
});

export default mongoose.model("ModulePermission", modulePermissionSchema);