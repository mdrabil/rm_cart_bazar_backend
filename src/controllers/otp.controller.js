import Otp from "../models/otp.model.js";

import { generateMRId } from "../utils/mrId.js";
import Joi from "joi";
import moment from "moment";
import { config } from "../config/config.js";
import UserModel from "../models/User.model.js";

// ------------------- OTP SEND -------------------
export const sendOtp = async (req, res) => {
  try {
    // Validation
    const schema = Joi.object({
      userId: Joi.string().required(),
      type: Joi.string().valid("LOGIN", "TRANSACTION", "PASSWORD_RESET").default("LOGIN"),
      expiryMinutes: Joi.number().integer().min(1).max(30).default(5)
    });
    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { userId, type, expiryMinutes } = value;

    // Check user exists
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP
    const otpValue = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = moment().add(expiryMinutes, "minutes").toDate();

    const otpDoc = await Otp.create({
      user: user._id,
      otp: otpValue,
      type,
      expiresAt
    });

    // TODO: send via SMS / email
    console.log(`OTP for ${user.fullName}: ${otpValue} (expires in ${expiryMinutes} min)`);

    return res.json({
      message: `OTP sent successfully to user ${user.fullName}`,
      otpId: otpDoc.mrOtpId,
      expiresAt
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------- OTP VERIFY -------------------
export const verifyOtp = async (req, res) => {
  try {
    const schema = Joi.object({
      userId: Joi.string().required(),
      otp: Joi.string().length(6).required(),
      type: Joi.string().valid("LOGIN", "TRANSACTION", "PASSWORD_RESET").default("LOGIN")
    });

    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { userId, otp, type } = value;

    // Find OTP
    const otpRecord = await Otp.findOne({
      user: userId,
      otp,
      type,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP invalid or expired" });
    }

    // Mark as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    return res.json({ message: "OTP verified successfully", otpId: otpRecord.mrOtpId });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};
