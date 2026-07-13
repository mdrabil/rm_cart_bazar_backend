import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { createRole, deleteRole, getAllRoles, toggleRoleStatus, updateRole } from "../../controllers/role.controller.js";


const router = express.Router();

router.post("/", authMiddleware, adminOnly, createRole);
router.get("/", authMiddleware, getAllRoles);
router.put("/:id", authMiddleware, adminOnly, updateRole);
router.delete("/:id", authMiddleware, adminOnly, deleteRole);
router.post("/:id/toggle-status", authMiddleware, adminOnly, toggleRoleStatus);

export default router;
