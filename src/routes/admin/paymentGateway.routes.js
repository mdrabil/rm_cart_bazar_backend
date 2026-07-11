import express from "express";
import {
  getGatewayAuditLogs,
  getPaymentGatewayById,
  listPaymentGateways,
  setDefaultGateway,
  toggleGatewayStatus,
  updatePaymentGateway,
} from "../../controllers/admin/paymentGateway.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { adminOnly } from "../../middlewares/adminOnly.js";

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get("/", listPaymentGateways);
router.get("/audit-logs", getGatewayAuditLogs);
router.get("/:id", getPaymentGatewayById);
router.patch("/:id", updatePaymentGateway);
router.patch("/:id/default", setDefaultGateway);
router.patch("/:id/toggle-status", toggleGatewayStatus);

export default router;
