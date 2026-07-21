import { EMAIL_TYPE, sendTemplateEmail } from "../../services/email/email.service.js";
import Customer from "../../models/Customer.js";
import CustomerOtpModel from "../../models/CustomerOtp.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../config/config.js";

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Customer.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // unblock after 24h
    const record = await CustomerOtpModel.findOne({ email });

    if (record?.blockedUntil && record.blockedUntil < new Date()) {
      await CustomerOtpModel.updateOne(
        { email },
        { isBlocked: false, attempts: 0, blockedUntil: null }
      );
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await CustomerOtpModel.findOneAndDelete({ email });

    await CustomerOtpModel.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendTemplateEmail({
      type: EMAIL_TYPE.EMAIL_VERIFICATION_OTP,
      to: email,
      data: {
        customerName: user.fullName || "Customer",
        otp,
        otpExpiryMinutes: 5,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "OTP sent Successfully" });
  } catch (err) {
    console.error("App OTP send error:", err.code || "", err.message);
    return res.status(err.code === "EMAIL_TIMEOUT" ? 503 : 500).json({
      success: false,
      message: err.message || "Failed to send OTP",
      code: err.code || "EMAIL_SEND_FAILED",
    });
  }
};

// ================= VERIFY OTP =================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await CustomerOtpModel.findOne({ email });

    if (!record)
      return res.status(400).json({ message: "OTP expired or invalid" });

    // expired check
    if (record.expiresAt < new Date()) {
      await CustomerOtpModel.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    // blocked check
    if (record.isBlocked) {
      return res.status(403).json({
        message: "Blocked for 24 hours due to multiple attempts",
      });
    }

    // wrong otp
    if (record.otp !== otp) {
      record.attempts += 1;

      // block after 10 attempts (24 hours)
      if (record.attempts >= 10) {
        record.isBlocked = true;
        record.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      await record.save();

      return res.status(400).json({
        message: "Invalid OTP",
        attemptsLeft: 10 - record.attempts,
      });
    }

    // success
    await CustomerOtpModel.deleteOne({ email });

    const resetToken = jwt.sign(
      { email, purpose: "customer-password-reset" },
      config.jwtSecret,
      { expiresIn: "15m" }
    );

    res.json({ success: true, message: "OTP verified", resetToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= RESET PASSWORD =================

export const resetPassword = async (req, res) => {
  try {
    const { email, password, resetToken } = req.body;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required. Verify OTP first.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, config.jwtSecret);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Reset token expired or invalid. Please verify OTP again.",
      });
    }

    if (
      decoded.purpose !== "customer-password-reset" ||
      !decoded.email ||
      decoded.email.toLowerCase() !== String(email || "").toLowerCase()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token for this email",
      });
    }

    const user = await Customer.findOne({ email: decoded.email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset done" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
