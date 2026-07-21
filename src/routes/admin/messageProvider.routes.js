import express from "express";
import {
  createMessageProvider,
  deleteMessageProvider,
  getMessageProviderById,
  listMessageProviders,
  setDefaultMessageProvider,
  toggleMessageProviderStatus,
  updateMessageProvider,
} from "../../controllers/admin/messageProvider.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

// Paths match product requirements
router.get("/list", listMessageProviders);
router.post("/create", createMessageProvider);
router.put("/update/:id", updateMessageProvider);
router.patch("/status/:id", toggleMessageProviderStatus);

// Extra parity with payment gateways
router.patch("/default/:id", setDefaultMessageProvider);
router.get("/:id", getMessageProviderById);
router.delete("/:id", deleteMessageProvider);

export default router;
