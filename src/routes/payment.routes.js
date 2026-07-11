// ============================
// STEP 7
// ROUTES
// routes/payment.routes.js
// ============================

import express from "express";

import {
  createPaymentOrderController,
  createCheckoutSessionController,
  deletePayment,
  getActiveGatewayController,
  getNonSuccessPayments,
  getPaymentById,
  getPayments,
  paymentWebhookController,
  paymentReturnController,
  renderCheckoutPageController,
  saveFailedPaymentController,
  updatePaymentStatus,
  verifyPaymentController,
} from "../controllers/payment.controller.js";
import { customerAuth } from "../middlewares/customerAuth.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { checkPermission } from "../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../constants/enums.js";
const router = express.Router();




router.post("/create-order", customerAuth, createPaymentOrderController);
router.post("/checkout-session", customerAuth, createCheckoutSessionController);
router.get("/active-gateway", getActiveGatewayController);
router.all("/return/:sessionId", paymentReturnController);
router.get("/page/:sessionId", renderCheckoutPageController);
router.post("/webhook/:gatewayName", paymentWebhookController);
router.post("/failed", customerAuth, saveFailedPaymentController);
router.post("/verify", customerAuth, verifyPaymentController);


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


// ======================================
// UPDATE PAYMENT STATUS
// ======================================
router.patch(
  "/:id/status",
  authMiddleware,
  checkPermission(MODULE_KEY.PAYMENTS, "update"),
  updatePaymentStatus
);


// ======================================
// DELETE PAYMENT
// ======================================
router.delete(
  "/:id",
  authMiddleware,
  checkPermission(MODULE_KEY.PAYMENTS, "delete"),
  deletePayment
);



export default router;