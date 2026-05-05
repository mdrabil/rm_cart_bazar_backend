import express from "express";
import { registerUser, loginUser, refreshToken, logoutUser } from "../controllers/auth.controller.js";

const router = express.Router();

// Register (SUPER_ADMIN only)
router.post("/register", registerUser);



// Login
router.post("/login", loginUser);

// Refresh JWT
router.post("/refresh-token", refreshToken);

// Logout
router.post("/logout", logoutUser);

export default router;
