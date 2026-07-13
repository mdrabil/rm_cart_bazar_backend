import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,          // CREATE_ORDER
  moduleKey: String,       // ORDER / PRODUCT
  meta: Object,            // {orderId, amount}
  ip: String,
  userAgent: String
},{ timestamps:true });

export default mongoose.model("AuditLog", auditLogSchema);

