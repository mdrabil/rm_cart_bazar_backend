import express from "express";
import {
  getAdminLanguagePreferences,
  toggleLanguagePreferenceStatus,
} from "../../controllers/admin/languagePreference.admin.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminAndSuperAdmin } from "../../middlewares/adminOnly.js";

const router = express.Router();

router.use(authMiddleware, adminAndSuperAdmin);

router.get("/", getAdminLanguagePreferences);
router.patch("/:id/toggle-status", toggleLanguagePreferenceStatus);

export default router;
