import crypto from "crypto";
import User from "../models/User.model.js";
import { sendEmail } from "../constants/mailer.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { config } from "../config/config.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createResetToken = () => crypto.randomBytes(32).toString("hex");

export const maskEmail = (email = "") => {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "your email";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(local.length - 2, 2))}@${domain}`;
};

export const requestPasswordReset = async (email) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+resetPasswordToken +resetPasswordExpires"
  );

  if (!user || user.isBlocked || !user.email) {
    return { sent: false, maskedEmail: maskEmail(normalizedEmail) };
  }

  const rawToken = createResetToken();
  user.resetPasswordToken = hashToken(rawToken);
  user.resetPasswordExpires = new Date(
    Date.now() + config.passwordResetExpiresMs
  );
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${config.adminPanelUrl}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your MRCRAFTED admin password",
    text: `You requested a password reset. Open this link within 1 hour:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#321fdb;margin:0 0 12px;">Password Reset</h2>
        <p style="color:#4f5d73;line-height:1.6;">
          We received a request to reset your admin account password.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#321fdb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#8a93a2;font-size:13px;line-height:1.5;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return { sent: true, maskedEmail: maskEmail(user.email) };
};

export const verifyResetToken = async (token) => {
  const hashed = hashToken(String(token || "").trim());
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("email fullName");

  if (!user) {
    return { valid: false };
  }

  return {
    valid: true,
    email: maskEmail(user.email),
    fullName: user.fullName,
  };
};

export const resetPasswordWithToken = async (token, password) => {
  const hashed = hashToken(String(token || "").trim());
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+passwordHash +resetPasswordToken +resetPasswordExpires +refreshToken");

  if (!user) {
    return { success: false, message: "Invalid or expired reset link" };
  }

  user.passwordHash = await hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshToken = null;
  await user.save();

  return { success: true };
};
