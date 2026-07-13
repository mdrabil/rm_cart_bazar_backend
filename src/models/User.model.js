import mongoose from "mongoose";

import { generateMRId } from "../utils/mrId.js";

const socialSchema = new mongoose.Schema(
  {
    name: String,

    url: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    mrId: { type: String, unique: true, index: true },
    refreshToken: { type: String, select: false },
    fullName: { type: String, required: true },
   dp: {
  url: { type: String, default: null },
  public_id: { type: String, default: null },
},
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true, sparse: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    socials: [socialSchema],

    isBlocked: { type: Boolean, default: false },
    lastLoginAt: Date
  },
  { timestamps: true }
);


/* --------------------------------------------------
 🔥 AUTO MR ID (ASYNC SAFE)
-------------------------------------------------- */
userSchema.pre("save", async function (next) {
  if (!this.mrId) this.mrId = await generateMRId("USR","USER");
  next();
});

// User model
userSchema.index({
  fullName: "text",
  mobile: "text",
  email: "text"
});






export default mongoose.model("User", userSchema);
