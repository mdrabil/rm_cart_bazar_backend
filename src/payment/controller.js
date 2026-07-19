/**
 * Payment HTTP handlers — customer-facing routes only.
 * Admin listing lives in controllers/payment.controller.js
 */

import Payment from "./index.js";
import PaymentCheckoutSession from "../models/PaymentCheckoutSession.model.js";
import {
  escapeHtml,
  setPageHeaders,
  redirectHtml,
  customerSafePaymentError,
  CUSTOMER_PAYMENT_MESSAGE,
} from "./config.js";

export const createPaymentController = async (req, res) => {
  try {
    const result = await Payment.create(req.user._id, req.user, req.body);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: customerSafePaymentError(error),
    });
  }
};

export const createCheckoutSessionController = createPaymentController;

export const createPaymentOrderController = async (req, res) => {
  try {
    const result = await Payment.createOrder(req.user._id, {
      couponCode: req.body.couponCode,
      platform: req.body.platform || "website",
      user: req.user,
      returnUrl: req.body.returnUrl,
      cancelUrl: req.body.cancelUrl,
      deliveryAddress: req.body.deliveryAddress,
      deliveryDate: req.body.deliveryDate,
      notes: req.body.notes,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: customerSafePaymentError(error),
    });
  }
};

export const verifyPaymentController = async (req, res) => {
  try {
    const result = await Payment.verifyForCustomer(req.user._id, req.user, {
      ...req.body,
      platform: req.body.platform || "website",
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: customerSafePaymentError(error),
    });
  }
};

export const saveFailedPaymentController = async (req, res) => {
  try {
    const result = await Payment.saveFailedPayment(req.user, {
      ...req.body,
      platform: req.body.platform || "website",
    });
    return res.status(200).json({
      success: true,
      message: "Failed payment saved",
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: customerSafePaymentError(error),
    });
  }
};

export const getActiveGatewayController = async (req, res) => {
  try {
    const info = await Payment.getActiveGatewayInfo(req.query.platform || "website");
    return res.json({ success: true, gateway: info });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const paymentWebhookController = async (req, res) => {
  try {
    const { gatewayName } = req.params;
    const result = await Payment.handleWebhook(gatewayName, req);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const renderCheckoutPageController = async (req, res) => {
  try {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.get("host");
    const apiBaseUrl = `${protocol}://${host}`.replace(/\/$/, "");

    const { html, csp } = await Payment.getCheckoutPage(req.params.sessionId, apiBaseUrl);
    setPageHeaders(res, csp);
    return res.status(200).send(html);
  } catch (error) {
    console.error("renderCheckoutPageController:", error);
    setPageHeaders(res);
    return res.status(500).send(
      `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Payment</title></head><body><h2>Payment unavailable</h2><p>${escapeHtml(CUSTOMER_PAYMENT_MESSAGE.unavailable)}</p></body></html>`
    );
  }
};

export const paymentReturnController = async (req, res) => {
  try {
    const result = await Payment.handleReturn(req.params.sessionId, req);
    setPageHeaders(res);
    return res.status(200).send(redirectHtml(result.targetUrl));
  } catch (error) {
    console.error("paymentReturnController:", error);
    const safeReason = customerSafePaymentError(error);
    try {
      const session = await PaymentCheckoutSession.findOne({
        sessionId: req.params.sessionId,
      });
      if (session?.cancelUrl) {
        setPageHeaders(res);
        return res
          .status(200)
          .send(
            redirectHtml(
              buildFailRedirect(session.cancelUrl, {
                status:
                  safeReason === CUSTOMER_PAYMENT_MESSAGE.cancelled
                    ? "cancelled"
                    : "failed",
                reason: safeReason,
                sessionId: session.sessionId,
              })
            )
          );
      }
    } catch {
      /* ignore */
    }
    return res.status(400).send(
      `<h2>${escapeHtml(CUSTOMER_PAYMENT_MESSAGE.generic)}</h2>`
    );
  }
};

function buildFailRedirect(baseUrl, fields) {
  const joiner = baseUrl.includes("?") ? "&" : "?";
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([k, v]) => {
    if (v != null && v !== "") params.set(k, String(v));
  });
  return `${baseUrl}${joiner}${params.toString()}`;
}

export const getSessionStatusController = async (req, res) => {
  try {
    const session = await Payment.getCheckoutSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        status: "expired",
        message: "Session not found or expired",
      });
    }

    if (String(session.customerId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this payment session",
      });
    }

    const result = await Payment.getSessionStatus(req.params.sessionId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      status: "failed",
      message: customerSafePaymentError(error),
    });
  }
};
