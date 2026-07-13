import express from "express";
import {
  getMyPermissions,
  getAllPermissions,
  createOrUpdatePermission,
  deletePermission,
} from "../../controllers/modulePermission.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/me", getMyPermissions);

router.get(
  "/",
  checkPermission(MODULE_KEY.ROLES, "read"),
  getAllPermissions
);

router.post(
  "/",
  checkPermission(MODULE_KEY.ROLES, "update"),
  createOrUpdatePermission
);

// Delete permission (admin only)
// router.delete("/:id", deletePermission);

export default router;