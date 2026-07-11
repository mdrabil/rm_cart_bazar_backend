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

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);

router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.get("/verify-reset-token/:token", verifyPasswordResetToken);
router.post("/verify-reset-token", verifyPasswordResetToken);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

export default router;
