/**
 * Payment routes — mount at /api/payment
 */

import express from "express";
import { customerAuth } from "../middlewares/customerAuth.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../constants/enums.js";
import {
  createPaymentController,
  createPaymentOrderController,
  createCheckoutSessionController,
  getActiveGatewayController,
  paymentWebhookController,
  paymentReturnController,
  renderCheckoutPageController,
  saveFailedPaymentController,
  verifyPaymentController,
} from "./controller.js";
import {
  deletePayment,
  getNonSuccessPayments,
  getPaymentById,
  getPayments,
  updatePaymentStatus,
} from "../controllers/payment.controller.js";

const router = express.Router();

// ── Customer (gateway-agnostic) ─────────────────────────────────────────────
router.post("/create", customerAuth, createPaymentController);
router.post("/checkout-session", customerAuth, createCheckoutSessionController);
router.post("/create-order", customerAuth, createPaymentOrderController);
router.get("/active-gateway", getActiveGatewayController);
router.all("/return/:sessionId", paymentReturnController);
router.get("/page/:sessionId", renderCheckoutPageController);
router.post("/webhook/:gatewayName", paymentWebhookController);
router.post("/failed", customerAuth, saveFailedPaymentController);
router.post("/verify", customerAuth, verifyPaymentController);

// ── Admin ───────────────────────────────────────────────────────────────────
router.get(
  "/",
  authMiddleware,
  checkPermission(MODULE_KEY.PAYMENTS, "read"),
  getPayments
);

router.get(
  "/failed-payment",
  authMiddleware,
  checkPermission(MODULE_KEY.PAYMENTS, "read"),
  getNonSuccessPayments
);

router.get(
  "/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.PAYMENTS, "read"),
  getPaymentById
);

router.patch(
  "/:id/status",
  authMiddleware,
  checkPermission(MODULE_KEY.PAYMENTS, "update"),
  updatePaymentStatus
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.PAYMENTS, "delete"),
  deletePayment
);

export default router;
