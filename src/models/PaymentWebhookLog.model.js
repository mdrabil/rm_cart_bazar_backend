import mongoose from "mongoose";

const paymentWebhookLogSchema = new mongoose.Schema(
  {
    gatewayName: { type: String, required: true, index: true },
    eventType: { type: String, required: true },
    eventId: { type: String, index: true },
    gatewayOrderId: { type: String, index: true },
    transactionId: { type: String, sparse: true },
    payload: { type: Object },
    signatureValid: { type: Boolean, default: false },
    processed: { type: Boolean, default: false },
    processingError: { type: String },
    fulfillmentResult: { type: Object },
    retryCount: { type: Number, default: 0 },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model("PaymentWebhookLog", paymentWebhookLogSchema);
