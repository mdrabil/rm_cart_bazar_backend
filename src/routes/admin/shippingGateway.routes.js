import express from "express";
import {
  createShippingGateway,
  deleteShippingGateway,
  getProviderAuditLogs,
  getShippingGatewayById,
  listShippingGateways,
  setDefaultProvider,
  toggleProviderStatus,
  updateShippingGateway,
} from "../../controllers/admin/shippingGateway.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/", listShippingGateways);
router.get("/audit-logs", getProviderAuditLogs);
router.post("/", createShippingGateway);
router.get("/:id", getShippingGatewayById);
router.patch("/:id", updateShippingGateway);
router.delete("/:id", deleteShippingGateway);
router.patch("/:id/default", setDefaultProvider);
router.patch("/:id/toggle-status", toggleProviderStatus);

export default router;
