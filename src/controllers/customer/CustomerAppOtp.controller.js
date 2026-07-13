import { sendEmail } from "../../constants/mailer.js";
import Customer from "../../models/Customer.js";
import CustomerOtpModel from "../../models/CustomerOtp.model.js";
import Otp from "../../models/CustomerOtp.model.js";
import bcrypt from "bcryptjs";


export const sendOtp = async (req, res) => {


  try {
    const { email } = req.body;

    

    const user = await Customer.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 🔥 unblock after 24h
    const record = await CustomerOtpModel.findOne({ email });

    if (record?.blockedUntil && record.blockedUntil < new Date()) {
      await CustomerOtpModel.updateOne(
        { email },
        { isBlocked: false, attempts: 0, blockedUntil: null }
      );
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await CustomerOtpModel.findOneAndDelete({ email });

  const savedOtp = await CustomerOtpModel.create({
  email,
  otp,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
});


await sendEmail(
  email,
  "OTP Verification",
  `Your OTP is ${otp}. It is valid for 5 minutes. Do not share it.`
);

console.log("OTP SAVED =>", savedOtp);

    res.status(200).json({ success: true, message: "OTP sent Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// ================= VERIFY OTP =================
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    
    const record = await CustomerOtpModel.findOne({ email });
    
    console.log("get the data",req.body)
    console.log("get the data in db",record)
    if (!record)
      return res.status(400).json({ message: "OTP expired or invalid" });

    // ❌ expired check
    if (record.expiresAt < new Date()) {
      await CustomerOtpModel.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    // ❌ blocked check
    if (record.isBlocked) {
      return res.status(403).json({
        message: "Blocked for 24 hours due to multiple attempts",
      });
    }

    // ❌ wrong otp
    if (record.otp !== otp) {
      record.attempts += 1;

      // 🔥 block after 10 attempts (24 hours)
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

    // ✅ success
    await CustomerOtpModel.deleteOne({ email });

    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= RESET PASSWORD =================

export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Customer.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 🔥 HASH PASSWORD (VERY IMPORTANT)
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset done" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};