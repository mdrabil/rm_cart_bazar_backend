import express from "express";
import {
  getAdminLanguagePreferences,
  toggleLanguagePreferenceStatus,
} from "../../controllers/admin/languagePreference.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/", getAdminLanguagePreferences);
router.patch("/:id/toggle-status", toggleLanguagePreferenceStatus);

export default router;
