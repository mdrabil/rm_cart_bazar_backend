// /**
//  * Payment HTTP handlers — customer-facing routes only.
//  * Admin listing lives in controllers/payment.controller.js
//  */

// import Payment from "./index.js";
// import PaymentCheckoutSession from "../models/PaymentCheckoutSession.model.js";
// import {
//   escapeHtml,
//   setPageHeaders,
//   redirectHtml,
//   customerSafePaymentError,
//   CUSTOMER_PAYMENT_MESSAGE,
// } from "./config.js";

// export const createPaymentController = async (req, res) => {
//   try {
//     const result = await Payment.create(req.user._id, req.user, req.body);
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const createCheckoutSessionController = createPaymentController;

// export const createPaymentOrderController = async (req, res) => {
//   try {
//     const result = await Payment.createOrder(req.user._id, {
//       couponCode: req.body.couponCode,
//       platform: req.body.platform || "website",
//       user: req.user,
//       returnUrl: req.body.returnUrl,
//       cancelUrl: req.body.cancelUrl,
//       deliveryAddress: req.body.deliveryAddress,
//       deliveryDate: req.body.deliveryDate,
//       notes: req.body.notes,
//     });
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const verifyPaymentController = async (req, res) => {
//   try {
//     const result = await Payment.verifyForCustomer(req.user._id, req.user, {
//       ...req.body,
//       platform: req.body.platform || "website",
//     });
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const saveFailedPaymentController = async (req, res) => {
//   try {
//     const result = await Payment.saveFailedPayment(req.user, {
//       ...req.body,
//       platform: req.body.platform || "website",
//     });
//     return res.status(200).json({
//       success: true,
//       message: "Failed payment saved",
//       ...result,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const getActiveGatewayController = async (req, res) => {
//   try {
//     const info = await Payment.getActiveGatewayInfo(req.query.platform || "website");
//     return res.json({ success: true, gateway: info });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// export const paymentWebhookController = async (req, res) => {
//   try {
//     const { gatewayName } = req.params;
//     const result = await Payment.handleWebhook(gatewayName, req);
//     return res.json(result);
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// export const renderCheckoutPageController = async (req, res) => {
//   try {
//     const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
//     const host = req.headers["x-forwarded-host"] || req.get("host");
//     const apiBaseUrl = `${protocol}://${host}`.replace(/\/$/, "");

//     const { html, csp } = await Payment.getCheckoutPage(req.params.sessionId, apiBaseUrl);
//     setPageHeaders(res, csp);
//     return res.status(200).send(html);
//   } catch (error) {
//     console.error("renderCheckoutPageController:", error);
//     setPageHeaders(res);
//     return res.status(500).send(
//       `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Payment</title></head><body><h2>Payment unavailable</h2><p>${escapeHtml(CUSTOMER_PAYMENT_MESSAGE.unavailable)}</p></body></html>`
//     );
//   }
// };

// export const paymentReturnController = async (req, res) => {
//   try {
//     const result = await Payment.handleReturn(req.params.sessionId, req);
//     setPageHeaders(res);
//     return res.status(200).send(redirectHtml(result.targetUrl));
//   } catch (error) {
//     console.error("paymentReturnController:", error);
//     const safeReason = customerSafePaymentError(error);
//     try {
//       const session = await PaymentCheckoutSession.findOne({
//         sessionId: req.params.sessionId,
//       });
//       if (session?.cancelUrl) {
//         setPageHeaders(res);
//         return res
//           .status(200)
//           .send(
//             redirectHtml(
//               buildFailRedirect(session.cancelUrl, {
//                 status:
//                   safeReason === CUSTOMER_PAYMENT_MESSAGE.cancelled
//                     ? "cancelled"
//                     : "failed",
//                 reason: safeReason,
//                 sessionId: session.sessionId,
//               })
//             )
//           );
//       }
//     } catch {
//       /* ignore */
//     }
//     return res.status(400).send(
//       `<h2>${escapeHtml(CUSTOMER_PAYMENT_MESSAGE.generic)}</h2>`
//     );
//   }
// };

// function buildFailRedirect(baseUrl, fields) {
//   const joiner = baseUrl.includes("?") ? "&" : "?";
//   const params = new URLSearchParams();
//   Object.entries(fields).forEach(([k, v]) => {
//     if (v != null && v !== "") params.set(k, String(v));
//   });
//   return `${baseUrl}${joiner}${params.toString()}`;
// }

// export const getSessionStatusController = async (req, res) => {
//   try {
//     const session = await Payment.getCheckoutSession(req.params.sessionId);
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         status: "expired",
//         message: "Session not found or expired",
//       });
//     }

//     if (String(session.customerId) !== String(req.user._id)) {
//       return res.status(403).json({
//         success: false,
//         message: "You do not have access to this payment session",
//       });
//     }

//     const result = await Payment.getSessionStatus(req.params.sessionId);
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       status: "failed",
//       message: customerSafePaymentError(error),
//     });
//   }
// };



// /**
//  * Payment HTTP handlers — customer-facing routes only.
//  * Admin listing lives in controllers/payment.controller.js
//  */

// import Payment from "./index.js";
// import PaymentCheckoutSession from "../models/PaymentCheckoutSession.model.js";
// import {
//   escapeHtml,
//   setPageHeaders,
//   redirectHtml,
//   customerSafePaymentError,
//   CUSTOMER_PAYMENT_MESSAGE,
// } from "./config.js";

// export const createPaymentController = async (req, res) => {
//   try {
//     const result = await Payment.create(req.user._id, req.user, req.body);
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const createCheckoutSessionController = createPaymentController;

// export const createPaymentOrderController = async (req, res) => {
//   try {
//     const result = await Payment.createOrder(req.user._id, {
//       couponCode: req.body.couponCode,
//       platform: req.body.platform || "website",
//       user: req.user,
//       returnUrl: req.body.returnUrl,
//       cancelUrl: req.body.cancelUrl,
//       deliveryAddress: req.body.deliveryAddress,
//       deliveryDate: req.body.deliveryDate,
//       notes: req.body.notes,
//     });
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const verifyPaymentController = async (req, res) => {
//   try {
//     const result = await Payment.verifyForCustomer(req.user._id, req.user, {
//       ...req.body,
//       platform: req.body.platform || "website",
//     });
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const saveFailedPaymentController = async (req, res) => {
//   try {
//     const result = await Payment.saveFailedPayment(req.user, {
//       ...req.body,
//       platform: req.body.platform || "website",
//     });
//     return res.status(200).json({
//       success: true,
//       message: "Failed payment saved",
//       ...result,
//     });
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: customerSafePaymentError(error),
//     });
//   }
// };

// export const getActiveGatewayController = async (req, res) => {
//   try {
//     const info = await Payment.getActiveGatewayInfo(req.query.platform || "website");
//     return res.json({ success: true, gateway: info });
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// export const paymentWebhookController = async (req, res) => {
//   try {
//     const { gatewayName } = req.params;
//     const result = await Payment.handleWebhook(gatewayName, req);
//     return res.json(result);
//   } catch (error) {
//     return res.status(400).json({ success: false, message: error.message });
//   }
// };

// export const renderCheckoutPageController = async (req, res) => {
//   try {
//     const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
//     const host = req.headers["x-forwarded-host"] || req.get("host");
//     const apiBaseUrl = `${protocol}://${host}`.replace(/\/$/, "");

//     const { html, csp } = await Payment.getCheckoutPage(req.params.sessionId, apiBaseUrl);
//     setPageHeaders(res, csp);
//     return res.status(200).send(html);
//   } catch (error) {
//     console.error("renderCheckoutPageController:", error);
//     setPageHeaders(res);
//     return res.status(500).send(
//       `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Payment</title></head><body><h2>Payment unavailable</h2><p>${escapeHtml(CUSTOMER_PAYMENT_MESSAGE.unavailable)}</p></body></html>`
//     );
//   }
// };

// export const paymentReturnController = async (req, res) => {
//   try {
//     const result = await Payment.handleReturn(req.params.sessionId, req);
//     setPageHeaders(res);
//     return res.status(200).send(redirectHtml(result.targetUrl));
//   } catch (error) {
//     console.error("paymentReturnController:", error);
//     const safeReason = customerSafePaymentError(error);
//     try {
//       const session = await PaymentCheckoutSession.findOne({
//         sessionId: req.params.sessionId,
//       });
//       if (session?.cancelUrl) {
//         setPageHeaders(res);
//         return res
//           .status(200)
//           .send(
//             redirectHtml(
//               buildFailRedirect(session.cancelUrl, {
//                 status:
//                   safeReason === CUSTOMER_PAYMENT_MESSAGE.cancelled
//                     ? "cancelled"
//                     : "failed",
//                 reason: safeReason,
//                 sessionId: session.sessionId,
//               })
//             )
//           );
//       }
//     } catch {
//       /* ignore */
//     }
//     return res.status(400).send(
//       `<h2>${escapeHtml(CUSTOMER_PAYMENT_MESSAGE.generic)}</h2>`
//     );
//   }
// };

// function buildFailRedirect(baseUrl, fields) {
//   const joiner = baseUrl.includes("?") ? "&" : "?";
//   const params = new URLSearchParams();
//   Object.entries(fields).forEach(([k, v]) => {
//     if (v != null && v !== "") params.set(k, String(v));
//   });
//   return `${baseUrl}${joiner}${params.toString()}`;
// }

// export const getSessionStatusController = async (req, res) => {
//   try {
//     const session = await Payment.getCheckoutSession(req.params.sessionId);
//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         status: "expired",
//         message: "Session not found or expired",
//       });
//     }

//     if (String(session.customerId) !== String(req.user._id)) {
//       return res.status(403).json({
//         success: false,
//         message: "You do not have access to this payment session",
//       });
//     }

//     const result = await Payment.getSessionStatus(req.params.sessionId);
//     return res.status(200).json(result);
//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       status: "failed",
//       message: customerSafePaymentError(error),
//     });
//   }
// };


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
  console.log(`[Payment][Create] customer=${req.user?._id} platform=${req.body?.platform || "website"}`);
  try {
    const result = await Payment.create(req.user._id, req.user, req.body);
    console.log(`[Payment][Create] success customer=${req.user._id} sessionId=${result?.sessionId}`);
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[Payment][Create] failed customer=${req.user?._id}:`, error);
    return res.status(400).json({
      success: false,
      message: customerSafePaymentError(error),
    });
  }
};

export const createCheckoutSessionController = createPaymentController;

export const createPaymentOrderController = async (req, res) => {
  console.log(`[Payment][CreateOrder] customer=${req.user?._id} platform=${req.body?.platform || "website"}`);
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
    console.log(`[Payment][CreateOrder] success customer=${req.user._id} sessionId=${result?.sessionId} gatewayOrderId=${result?.gatewayOrderId}`);
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[Payment][CreateOrder] failed customer=${req.user?._id}:`, error);
    return res.status(400).json({
      success: false,
      message: customerSafePaymentError(error),
    });
  }
};

export const verifyPaymentController = async (req, res) => {
  console.log(`[Payment][Verify] customer=${req.user?._id} sessionId=${req.body?.sessionId} orderId=${req.body?.gatewayOrderId || req.body?.razorpay_order_id}`);
  try {
    const result = await Payment.verifyForCustomer(req.user._id, req.user, {
      ...req.body,
      platform: req.body.platform || "website",
    });
    console.log(`[Payment][Verify] success customer=${req.user._id} status=${result?.status}`);
    return res.status(200).json(result);
  } catch (error) {
    console.error(`[Payment][Verify] failed customer=${req.user?._id}:`, error);
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
  const { gatewayName } = req.params;
  const eventId = req.body?.payload?.payment?.entity?.id || req.body?.event;
  console.log(`[Payment][Webhook] gateway=${gatewayName} event=${req.body?.event} entityId=${eventId}`);
  try {
    const result = await Payment.handleWebhook(gatewayName, req);
    console.log(`[Payment][Webhook] processed gateway=${gatewayName} entityId=${eventId} result=${JSON.stringify(result)}`);
    return res.json(result);
  } catch (error) {
    console.error(`[Payment][Webhook] failed gateway=${gatewayName} entityId=${eventId}:`, error);
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
  const { sessionId } = req.params;
  console.log(
    `[Payment][Return] incoming sessionId=${sessionId} method=${req.method} ` +
      `query=${JSON.stringify(req.query)}`
  );

  // This route intentionally has no customerAuth middleware — it's hit
  // directly by Razorpay's redirect, not by an authenticated fetch from our
  // frontend. Payment.handleReturn (src/payment/index.js) already resolves
  // the customer from the PaymentCheckoutSession record's stored
  // customerId, not from req.user, so no req.user dependency exists here.
  // We still look the session up first purely to have session.cancelUrl
  // available for the failure-redirect branch below.
  let session;
  try {
    session = await PaymentCheckoutSession.findOne({ sessionId });
  } catch (lookupError) {
    console.error(`[Payment][Return] session lookup failed sessionId=${sessionId}:`, lookupError);
  }

  if (!session) {
    console.warn(`[Payment][Return] no session found for sessionId=${sessionId}`);
    setPageHeaders(res);
    return res
      .status(400)
      .send(`<h2>${escapeHtml(CUSTOMER_PAYMENT_MESSAGE.generic)}</h2>`);
  }

  try {
    const result = await Payment.handleReturn(sessionId, req);
    console.log(
      `[Payment][Return] verified sessionId=${sessionId} status=${result.status || "success"} redirect=${result.targetUrl}`
    );
    setPageHeaders(res);
    return res.status(200).send(redirectHtml(result.targetUrl));
  } catch (error) {
    const safeReason = customerSafePaymentError(error);
    // Classify so failed / cancelled / incomplete are distinguishable in logs
    // instead of being lumped together as one generic failure.
    const status =
      safeReason === CUSTOMER_PAYMENT_MESSAGE.cancelled
        ? "cancelled"
        : /not completed|pending|incomplete/i.test(error?.message || "")
        ? "incomplete"
        : "failed";
    console.error(
      `[Payment][Return] verification failed sessionId=${sessionId} status=${status}:`,
      error
    );

    if (session?.cancelUrl) {
      setPageHeaders(res);
      return res
        .status(200)
        .send(
          redirectHtml(
            buildFailRedirect(session.cancelUrl, {
              status,
              reason: safeReason,
              sessionId: session.sessionId,
            })
          )
        );
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
  console.log(`[Payment][Status] customer=${req.user?._id} sessionId=${req.params.sessionId}`);
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