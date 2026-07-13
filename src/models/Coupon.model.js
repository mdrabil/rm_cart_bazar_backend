import mongoose from "mongoose";
import { COUPON_TYPE, COUPON_STATUS } from "../constants/enums.js";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    mrCouponId: { type: String, unique: true, index: true },
    title: { type: String, required: true },
    type: { type: String, enum: Object.values(COUPON_TYPE), required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(COUPON_STATUS), default: COUPON_STATUS.ACTIVE },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
