import rateLimit from "express-rate-limit";
import { config } from "../config/config.js";

const message = {
  success: false,
  message: "Too many attempts. Please try again later.",
};

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === "production" ? 5 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === "production" ? 10 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === "production" ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});
