import mongoose from "mongoose";
import { MODULE_KEY } from "../constants/enums.js";

const userPermissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    moduleKey: { type: String, required: true, index: true,enum:Object.values(MODULE_KEY) },
    permissions: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);


userPermissionSchema.index({ userId: 1, moduleKey: 1 }, { unique: true });

export default mongoose.model("UserPermission", userPermissionSchema);
