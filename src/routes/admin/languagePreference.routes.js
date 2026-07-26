import express from "express";
import {
  getAdminLanguagePreferences,
  toggleLanguagePreferenceStatus,
  deleteLanguagePreference,
  bulkDeleteLanguagePreferences,
} from "../../controllers/admin/languagePreference.admin.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminAndSuperAdmin } from "../../middlewares/adminOnly.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";

const router = express.Router();

router.use(authMiddleware, adminAndSuperAdmin);

router.get(
  "/",
  checkPermission(MODULE_KEY.CUSTOMERS, "read"),
  getAdminLanguagePreferences
);

router.patch(
  "/:id/toggle-status",
  checkPermission(MODULE_KEY.CUSTOMERS, "update"),
  toggleLanguagePreferenceStatus
);

router.delete(
  "/bulk",
  checkPermission(MODULE_KEY.CUSTOMERS, "delete"),
  bulkDeleteLanguagePreferences
);

router.delete(
  "/:id",
  checkPermission(MODULE_KEY.CUSTOMERS, "delete"),
  deleteLanguagePreference
);

export default router;
