import express from "express";
import {
  listUserPermissions,
  getUserRoleCoverage,
  createUserPermission,
  updateUserPermission,
  deleteUserPermission,
  bulkDeleteUserPermissions,
} from "../../controllers/admin/userPermission.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  checkPermission(MODULE_KEY.ROLES, "read"),
  listUserPermissions
);

router.get(
  "/role-coverage",
  checkPermission(MODULE_KEY.ROLES, "read"),
  getUserRoleCoverage
);

router.post(
  "/",
  checkPermission(MODULE_KEY.ROLES, "create"),
  createUserPermission
);

router.put(
  "/:id",
  checkPermission(MODULE_KEY.ROLES, "update"),
  updateUserPermission
);

router.delete(
  "/bulk",
  checkPermission(MODULE_KEY.ROLES, "delete"),
  bulkDeleteUserPermissions
);

router.delete(
  "/:id",
  checkPermission(MODULE_KEY.ROLES, "delete"),
  deleteUserPermission
);

export default router;
