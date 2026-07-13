import mongoose from "mongoose";

const paymentVerificationLogSchema = new mongoose.Schema(
  {
    gatewayName: { type: String, required: true, index: true },
    source: {
      type: String,
      enum: ["webhook", "redirect", "api", "retry", "scheduled"],
      required: true,
    },
    gatewayOrderId: { type: String, index: true },
    transactionId: { type: String, sparse: true, index: true },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      index: true,
    },
    checkoutSessionId: { type: String, index: true },
    attempt: { type: Number, default: 1 },
    success: { type: Boolean, default: false },
    normalizedStatus: { type: String },
    error: { type: String },
    request: { type: Object },
    response: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model(
  "PaymentVerificationLog",
  paymentVerificationLogSchema
);
