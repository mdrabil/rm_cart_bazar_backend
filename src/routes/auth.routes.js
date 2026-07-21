import express from "express";
import {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
} from "../controllers/auth.controller.js";
import {
  forgotPassword,
  verifyPasswordResetToken,
  resetPassword,
} from "../controllers/passwordReset.controller.js";
import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
  loginLimiter,
} from "../middlewares/authRateLimit.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { bootstrapOrAdmin } from "../middlewares/adminOnly.js";
import {
  sendAuthOtp,
  verifyAuthOtp,
} from "../controllers/messaging/otp.controller.js";

const router = express.Router();

router.post("/register", bootstrapOrAdmin, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.get("/verify-reset-token/:token", verifyPasswordResetToken);
router.post("/verify-reset-token", verifyPasswordResetToken);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

// Unified customer OTP (email / phone) — identifier + sessionId contract
router.post("/send-otp", sendAuthOtp);
router.post("/verify-otp", verifyAuthOtp);

export default router;
