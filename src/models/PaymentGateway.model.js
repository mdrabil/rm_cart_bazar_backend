import mongoose from "mongoose";

export const GATEWAY_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
});

export const GATEWAY_MODE = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
});

export const SUPPORTED_PLATFORMS = Object.freeze([
  "website",
  "android",
  "ios",
]);

export const SUPPORTED_PAYMENT_TYPES = Object.freeze([
  "card",
  "upi",
  "netbanking",
  "wallet",
  "emi",
  "cod",
  "paylater",
]);

const paymentGatewaySchema = new mongoose.Schema(
  {
    gatewayName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(GATEWAY_STATUS),
      default: GATEWAY_STATUS.INACTIVE,
    },

    mode: {
      type: String,
      enum: Object.values(GATEWAY_MODE),
      default: GATEWAY_MODE.DEVELOPMENT,
    },

    priority: {
      type: Number,
      default: 100,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    supportedPlatforms: {
      type: [String],
      enum: SUPPORTED_PLATFORMS,
      default: ["website", "android", "ios"],
    },

    supportedPaymentTypes: {
      type: [String],
      enum: SUPPORTED_PAYMENT_TYPES,
      default: ["card", "upi", "netbanking", "wallet"],
    },

    description: {
      type: String,
      default: "",
    },

    webhookEnabled: {
      type: Boolean,
      default: false,
    },

    // ENV variable names only — never store actual credential values
    developmentKeyIdEnv: { type: String, trim: true },
    developmentSecretEnv: { type: String, trim: true },
    developmentMerchantIdEnv: { type: String, trim: true },

    productionKeyIdEnv: { type: String, trim: true },
    productionSecretEnv: { type: String, trim: true },
    productionMerchantIdEnv: { type: String, trim: true },

    webhookSecretEnv: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

paymentGatewaySchema.index({ status: 1, priority: 1 });
paymentGatewaySchema.index({ isDefault: 1, status: 1 });

export default mongoose.model("PaymentGateway", paymentGatewaySchema);
