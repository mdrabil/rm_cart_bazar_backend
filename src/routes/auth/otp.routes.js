import express from "express";
import {
  sendAuthOtp,
  verifyAuthOtp,
} from "../../controllers/messaging/otp.controller.js";

const router = express.Router();

router.post("/send-otp", sendAuthOtp);
router.post("/verify-otp", verifyAuthOtp);

export default router;
