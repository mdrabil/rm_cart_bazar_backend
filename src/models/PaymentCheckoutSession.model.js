import mongoose from "mongoose";

export const CHECKOUT_SESSION_STATUS = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  EXPIRED: "expired",
});

const paymentCheckoutSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    gatewayName: { type: String, required: true },
    gatewayOrderId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    couponCode: { type: String },
    platform: {
      type: String,
      enum: ["website", "android", "ios"],
      default: "website",
    },
    returnUrl: { type: String },
    cancelUrl: { type: String },
    deliveryAddress: { type: Object },
    deliveryDate: { type: Date },
    notes: { type: String },
    status: {
      type: String,
      enum: Object.values(CHECKOUT_SESSION_STATUS),
      default: CHECKOUT_SESSION_STATUS.PENDING,
    },
    expiresAt: { type: Date, required: true },
    metadata: { type: Object },
  },
  { timestamps: true }
);

paymentCheckoutSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model(
  "PaymentCheckoutSession",
  paymentCheckoutSessionSchema
);
