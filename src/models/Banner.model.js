// models/Banner.model.js
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    mrNo: {
      type: String,
      required: true,
    },

    // NEW
    platform: {
      type: [String],
      enum: ["APP", "WEB"],
      default: ["WEB"],
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);