import mongoose from "mongoose";

/**
 * Unified OTP session for email / SMS / WhatsApp.
 * Works with provider-generated OTPs (MessageCentral) and locally generated email OTPs.
 */
const otpVerificationSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
    },

    identifierType: {
      type: String,
      enum: ["email", "mobile"],
      required: true,
    },

    channel: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      required: true,
    },

    purpose: {
      type: String,
      enum: ["signup", "login", "password_reset", "verify"],
      default: "signup",
    },

    /** Local OTP (email). Optional when provider generates OTP. */
    otp: {
      type: String,
      default: null,
    },

    /** External provider verification id (e.g. MessageCentral). */
    verificationId: {
      type: String,
      default: null,
      index: true,
    },

    providerName: {
      type: String,
      default: null,
    },

    countryCode: {
      type: String,
      default: "91",
    },

    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },

    verified: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

otpVerificationSchema.index({ identifier: 1, purpose: 1, channel: 1 });

export default mongoose.model("OtpVerification", otpVerificationSchema);
