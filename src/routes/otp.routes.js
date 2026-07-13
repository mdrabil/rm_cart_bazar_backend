import express from "express";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protected routes or public based on flow
router.post("/send", authMiddleware, sendOtp);
router.post("/verify", authMiddleware, verifyOtp);

export default router;
