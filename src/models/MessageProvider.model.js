import mongoose from "mongoose";

export const MESSAGE_PROVIDER_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  MAINTENANCE: "maintenance",
});

export const MESSAGE_PROVIDER_MODE = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
});

export const MESSAGE_CHANNELS = Object.freeze([
  "sms",
  "whatsapp",
  "email",
]);

/**
 * Message / OTP provider config.
 * Stores ENV variable NAMES only — never actual secrets.
 */
const messageProviderSchema = new mongoose.Schema(
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
      enum: Object.values(MESSAGE_PROVIDER_STATUS),
      default: MESSAGE_PROVIDER_STATUS.INACTIVE,
    },

    mode: {
      type: String,
      enum: Object.values(MESSAGE_PROVIDER_MODE),
      default: MESSAGE_PROVIDER_MODE.DEVELOPMENT,
    },

    priority: {
      type: Number,
      default: 100,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    supportedChannels: {
      type: [String],
      enum: MESSAGE_CHANNELS,
      default: ["sms"],
    },

    description: {
      type: String,
      default: "",
    },

    // Development ENV names
    developmentApiKeyEnv: { type: String, trim: true },
    developmentCustomerIdEnv: { type: String, trim: true },
    developmentBaseUrlEnv: { type: String, trim: true },
    developmentCountryCodeEnv: { type: String, trim: true },
    developmentSenderIdEnv: { type: String, trim: true },

    // Production ENV names
    productionApiKeyEnv: { type: String, trim: true },
    productionCustomerIdEnv: { type: String, trim: true },
    productionBaseUrlEnv: { type: String, trim: true },
    productionCountryCodeEnv: { type: String, trim: true },
    productionSenderIdEnv: { type: String, trim: true },

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

messageProviderSchema.index({ status: 1, priority: 1 });
messageProviderSchema.index({ isDefault: 1, status: 1 });
messageProviderSchema.index({ supportedChannels: 1, status: 1, priority: 1 });

export default mongoose.model("MessageProvider", messageProviderSchema);
