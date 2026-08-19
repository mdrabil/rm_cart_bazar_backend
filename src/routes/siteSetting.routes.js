import express from "express";
import multer from "multer";
import { settingsImagesUpload } from "../middlewares/settingsImagesUpload.js";
import { createOrUpdateSettings, getSettings } from "../controllers/siteSetting.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminAndSuperAdmin } from "../middlewares/adminOnly.js";



const router = express.Router();

// Wrap multer so file-size / file-type errors return clean JSON
// instead of crashing or leaking a stack trace.
const uploadSettingsImages = (req, res, next) => {
  settingsImagesUpload()(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "One of the uploaded images exceeds the 5MB limit"
            : err.message,
      });
    }
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Public - anyone can read the current site settings
router.get("/public/settings", getSettings);

// Admin - single endpoint handles both first-time create and later updates
router.post(
  "/admin/settings",
authMiddleware,
  adminAndSuperAdmin,
  uploadSettingsImages,
  createOrUpdateSettings
);

export default router;
