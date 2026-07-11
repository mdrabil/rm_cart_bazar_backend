import mongoose from "mongoose";
import { MODULE_KEY } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";

const moduleSchema = new mongoose.Schema(
  {
    mrModuleId: {
      type: String,
      unique: true,
      index: true,
    },

    moduleKey: {
      type: String,
      enum: Object.values(MODULE_KEY),
      unique: true,
      required: true,
      index: true,
    },

    displayName: {
      type: String,
    },

    description: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* --------------------------------------------------
 🔥 UNIVERSAL MR ID GENERATION
-------------------------------------------------- */

// ✅ save / create
moduleSchema.pre("save", async function (next) {
  if (!this.mrModuleId) {
    this.mrModuleId = await generateMRId("MOD", "MODULE");
  }
  next();
});

// ✅ insertMany support
moduleSchema.pre("insertMany", async function (next, docs) {
  for (let doc of docs) {
    if (!doc.mrModuleId) {
      doc.mrModuleId = await generateMRId("MOD", "MODULE");
    }
  }
  next();
});

// ✅ update safety (optional but pro)
moduleSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (!update?.$set?.mrModuleId) {
    const mrId = await generateMRId("MOD", "MODULE");

    this.setUpdate({
      ...update,
      $set: {
        ...update.$set,
        mrModuleId: mrId,
      },
    });
  }

  next();
});

export default mongoose.model("Module", moduleSchema);