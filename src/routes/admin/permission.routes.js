import express from "express";
import {
  getMyPermissions,
  getAllPermissions,
  createOrUpdatePermission,
  deletePermission,
} from "../../controllers/modulePermission.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

// My permissions (any user)
router.get("/me", getMyPermissions);

// List all permissions (admin only)
router.get("/", getAllPermissions);

// Create / Update permission (admin only)
router.post("/", createOrUpdatePermission);

// Delete permission (admin only)
// router.delete("/:id", deletePermission);

export default router;