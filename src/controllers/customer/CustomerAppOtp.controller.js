/**
 * Customer OTP / password-reset — delegates to Messaging OTP (same as /api/auth/*).
 * Keeps /customer/auth/send-otp|verify-otp|reset-password working for website + app.
 */

import Messaging from "../../messaging/index.js";
import Customer from "../../models/Customer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../config/config.js";
import {
  sendAuthOtp,
  verifyAuthOtp,
} from "../messaging/otp.controller.js";

/**
 * POST /customer/auth/send-otp
 * Body: { identifier } or legacy { email }
 * Default purpose: password_reset (forgot-password). Pass purpose:"signup" for signup OTP.
 */
export const sendOtp = async (req, res) => {
  req.body = {
    ...req.body,
    identifier: req.body.identifier || req.body.email || req.body.mobile,
    purpose: req.body.purpose || "password_reset",
  };
  return sendAuthOtp(req, res);
};

/**
 * POST /customer/auth/verify-otp
 * Body: { sessionId, otp } (preferred) or legacy { email, otp }
 */
export const verifyOtp = async (req, res) => {
  req.body = {
    ...req.body,
    purpose: req.body.purpose || "password_reset",
    identifier: req.body.identifier || req.body.email || req.body.mobile,
  };
  return verifyAuthOtp(req, res);
};

/**
 * POST /customer/auth/reset-password
 * Body: { identifier|email|mobile, password, resetToken }
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, password, resetToken, identifier, mobile } = req.body;

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required. Verify OTP first.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
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

    if (decoded.purpose !== "customer-password-reset") {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const idValue =
      decoded.identifier ||
      decoded.email ||
      decoded.mobile ||
      identifier ||
      email ||
      mobile;

    if (!idValue) {
      return res.status(400).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const identity = Messaging.detectIdentifier(idValue);
    const tokenId = decoded.identifier || decoded.email || decoded.mobile;

    if (tokenId) {
      const tokenIdentity = Messaging.detectIdentifier(String(tokenId));
      if (tokenIdentity.identifier !== identity.identifier) {
        return res.status(400).json({
          success: false,
          message: "Invalid reset token for this account",
        });
      }
    }

    const query =
      identity.identifierType === "email"
        ? { email: identity.identifier }
        : { mobile: identity.identifier };

    const user = await Customer.findOne(query);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    return res.json({ success: true, message: "Password reset done" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
