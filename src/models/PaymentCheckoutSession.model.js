import mongoose from "mongoose";

export const CHECKOUT_SESSION_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
});

const paymentCheckoutSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    gatewayName: {
      type: String,
      required: true,
      index: true,
    },

    gatewayOrderId: {
      type: String,
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    couponCode: String,

    platform: {
      type: String,
      enum: ["website", "android", "ios"],
      default: "website",
    },

    returnUrl: String,
    cancelUrl: String,

    deliveryAddress: {
      type: mongoose.Schema.Types.Mixed,
    },

    deliveryDate: Date,
    notes: String,

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(CHECKOUT_SESSION_STATUS),
      default: CHECKOUT_SESSION_STATUS.PENDING,
      index: true,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    verificationAttempts: {
      type: Number,
      default: 0,
    },

    nextVerificationAt: {
      type: Date,
      index: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

paymentCheckoutSessionSchema.index({ customerId: 1, createdAt: -1 });
paymentCheckoutSessionSchema.index({ gatewayOrderId: 1, customerId: 1 });

export default mongoose.model(
  "PaymentCheckoutSession",
  paymentCheckoutSessionSchema
);
