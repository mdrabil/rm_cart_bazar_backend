import { BRAND } from "../../brand.js";
import { buildAccountEmail } from "../shared/accountEmail.js";

export const passwordResetEmail = (data = {}) => {
  const {
    customerName = "",
    resetUrl = "",
    expiryMinutes = 30,
    website = BRAND.website,
  } = data;

  return buildAccountEmail({
    subject: `${BRAND.companyName} — Reset Your Password`,
    preheader: "Click the link to reset your password securely.",
    eyebrow: "Password Reset",
    title: "Reset Your Password",
    subtitle: `This link will expire in ${expiryMinutes} minutes for your security.`,
    greetingName: customerName,
    introHtml: `<p style="margin:0 0 16px;line-height:1.7;">We received a request to reset the password for your MR Crafted account. Click the button below to choose a new password.</p>`,
    ctaLabel: "Reset Password",
    ctaUrl: resetUrl,
    website,
    alert: {
      type: "warning",
      title: "Didn't request this?",
      message:
        "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    },
  });
};

export default passwordResetEmail;
