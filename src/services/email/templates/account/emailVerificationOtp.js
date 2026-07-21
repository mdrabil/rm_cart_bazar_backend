import { BRAND } from "../../brand.js";
import { buildAccountEmail } from "../shared/accountEmail.js";

export const emailVerificationOtpEmail = (data = {}) => {
  const {
    customerName = "",
    otp = "000000",
    otpExpiryMinutes = 10,
    verifyUrl,
    website = BRAND.website,
  } = data;

  return buildAccountEmail({
    subject: `${BRAND.companyName} — Verify Your Email`,
    preheader: `Your verification code is ${otp}. Valid for ${otpExpiryMinutes} minutes.`,
    eyebrow: "Email Verification",
    title: "Verify Your Email Address",
    subtitle:
      "Please use the one-time password below to verify your email and secure your MR Crafted account.",
    greetingName: customerName,
    otp,
    otpExpiryMinutes,
    ctaLabel: verifyUrl ? "Verify Email" : "",
    ctaUrl: verifyUrl,
    website,
    alert: {
      type: "warning",
      title: "Security Reminder",
      message:
        "If you did not create an account with MR Crafted, please ignore this email. Your account will not be activated without verification.",
    },
  });
};

export default emailVerificationOtpEmail;
