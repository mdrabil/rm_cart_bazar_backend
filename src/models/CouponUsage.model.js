import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }
  },
  { timestamps: true }
);

// 🔥 Important: One user can use one coupon only once
couponUsageSchema.index({ coupon: 1, user: 1 }, { unique: true });

export default mongoose.model("CouponUsage", couponUsageSchema);