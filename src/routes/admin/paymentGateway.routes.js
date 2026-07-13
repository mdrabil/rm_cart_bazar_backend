import express from "express";
import {
  createPaymentGateway,
  deletePaymentGateway,
  getGatewayAuditLogs,
  getPaymentGatewayById,
  getVerificationLogs,
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
router.get("/verification-logs", getVerificationLogs);
router.post("/", createPaymentGateway);
router.get("/:id", getPaymentGatewayById);
router.patch("/:id", updatePaymentGateway);
router.delete("/:id", deletePaymentGateway);
router.patch("/:id/default", setDefaultGateway);
router.patch("/:id/toggle-status", toggleGatewayStatus);

export default router;
