/**
 * Email OTP / notification provider — Nodemailer templates.
 * OTP is generated locally and stored in OtpVerification.
 */

import { EMAIL_TYPE, sendTemplateEmail } from "../../../services/email/email.service.js";

export default function createEmailProvider(_credentials, providerDoc) {
  return {
    name: providerDoc.providerName,
    channels: providerDoc.supportedChannels || ["email"],

    async sendOtp({ email, otp, otpExpiryMinutes = 5, customerName = "Customer" }) {
      if (!email) throw new Error("Email is required for email OTP");
      if (!otp) throw new Error("OTP is required for email provider");

      await sendTemplateEmail({
        type: EMAIL_TYPE.EMAIL_VERIFICATION_OTP,
        to: email,
        data: {
          customerName,
          otp,
          otpExpiryMinutes,
        },
      });

      return {
        success: true,
        channel: "email",
        verificationId: null,
        providerGeneratesOtp: false,
      };
    },

    async sendMessage({ type, to, data = {}, subject }) {
      if (!to) throw new Error("Recipient email is required");
      if (!type) throw new Error("Email template type is required");

      return sendTemplateEmail({
        type,
        to,
        data,
        subject,
      });
    },

    async validateOtp({ storedOtp, code }) {
      if (!storedOtp || !code) return { success: false, message: "Invalid OTP" };
      if (String(storedOtp) !== String(code)) {
        return { success: false, message: "Invalid OTP" };
      }
      return { success: true };
    },
  };
}
