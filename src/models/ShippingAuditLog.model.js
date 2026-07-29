import mongoose from "mongoose";

const shippingAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },

    providerName: {
      type: String,
      index: true,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingGateway",
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

export default mongoose.model("ShippingAuditLog", shippingAuditLogSchema);
