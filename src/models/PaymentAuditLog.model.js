import mongoose from "mongoose";

const paymentAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },

    gatewayName: {
      type: String,
      index: true,
    },

    gatewayId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentGateway",
      index: true,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    previousState: {
      type: mongoose.Schema.Types.Mixed,
    },

    newState: {
      type: mongoose.Schema.Types.Mixed,
    },

    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

export default mongoose.model("PaymentAuditLog", paymentAuditLogSchema);
