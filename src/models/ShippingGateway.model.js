import mongoose from "mongoose";

export const PROVIDER_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
});

export const PROVIDER_MODE = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
});

const shippingGatewaySchema = new mongoose.Schema(
  {
    providerName: {
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
      enum: Object.values(PROVIDER_STATUS),
      default: PROVIDER_STATUS.INACTIVE,
    },

    mode: {
      type: String,
      enum: Object.values(PROVIDER_MODE),
      default: PROVIDER_MODE.DEVELOPMENT,
    },

    priority: {
      type: Number,
      default: 100,
    },

    isDefault: {
      type: Boolean,
      default: false,
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

    webhookUrl: { type: String, trim: true, default: "" },
    webhookUrlEnv: { type: String, trim: true },

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

shippingGatewaySchema.index({ status: 1, priority: 1 });
shippingGatewaySchema.index({ isDefault: 1, status: 1 });

export default mongoose.model("ShippingGateway", shippingGatewaySchema);
