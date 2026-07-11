import mongoose from "mongoose";

const paymentAuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    gatewayName: { type: String },
    gatewayId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentGateway" },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    previousState: { type: Object },
    newState: { type: Object },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentAuditLog", paymentAuditLogSchema);
