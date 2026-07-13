import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../constants/enums.js";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    amount: Number,

    method: String,

    mrPaymentId: {
      type: String,
      unique: true,
    },

    paymentMethodType: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "emi", "cod"],
    },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    gatewayOrderId: String,

    gatewayName: {
      type: String,
      default: "Razorpay",
    },

    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    customer: {
      name: String,
      email: String,
      phone: String,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    failureReason: {
      type: String,
      default: "",
    },

    checkoutSessionId: {
      type: String,
      index: true,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
    },

    nextVerificationAt: {
      type: Date,
      index: true,
    },

    completedAt: {
      type: Date,
    },

    verificationSource: {
      type: String,
      enum: ["webhook", "redirect", "api", "retry", "scheduled"],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Payment", paymentSchema);