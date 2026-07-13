/**
 * Payment module — single entry point.
 *
 * Flow:
 *   1. create()        → backend creates session + gateway payment
 *   2. webhook/verify  → server verifies with gateway API → fulfills order
 *   3. return          → UX redirect only (triggers server verify, never trusts query status)
 *   4. retry loop      → scheduled verification if webhook delayed
 */

import crypto from "crypto";
import mongoose from "mongoose";
import { config as appConfig } from "../config/config.js";
import { PAYMENT_STATUS } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";
import Payment from "../models/Payment.model.js";
import Customer from "../models/Customer.js";
import PaymentCheckoutSession, {
  CHECKOUT_SESSION_STATUS,
} from "../models/PaymentCheckoutSession.model.js";
import PaymentFactory, { loadGateway, getGatewayDocByName } from "./factory.js";
import {
  VERIFY_RETRY_MS,
  MAX_VERIFY_ATTEMPTS,
  SESSION_TTL_MS,
  normalizePlatform,
  resolveApiBase,
  buildReturnUrl,
  isPaidStatus,
} from "./config.js";
import * as webhookHandler from "./webhook.js";
import {
  calculateCartTotals,
  fulfillPaidOrder,
  createInitiatedPaymentRecord,
  findCompletedPayment,
} from "./orders.js";

// ── Validation helpers ────────────────────────────────────────────────────────

function assertCustomer(user) {
  if (!user?._id) throw new Error("Customer authentication required");
}

function assertAddress(address) {
  if (!address?.latitude || !address?.longitude) {
    throw new Error("Valid delivery address with coordinates is required");
  }
  if (!address.fullAddress?.trim()) throw new Error("Full address is required");
  if (!address.mobile?.trim()) throw new Error("Mobile number is required");
}

function nextRetryAt(attempt) {
  const ms = VERIFY_RETRY_MS[Math.min(attempt, VERIFY_RETRY_MS.length - 1)];
  return new Date(Date.now() + ms);
}

// ── Server-side verification (source of truth) ────────────────────────────────

export async function verifyPayment({
  source = "api",
  gatewayName,
  gatewayOrderId,
  transactionId,
  signature,
  customerId,
  user,
  deliveryAddress,
  couponCode,
  deliveryDate,
  notes,
  platform = "website",
  checkoutSession = null,
  paymentRecord = null,
}) {
  if (!gatewayOrderId) throw new Error("gatewayOrderId required");

  let resolvedGatewayName = gatewayName;
  if (!resolvedGatewayName) {
    resolvedGatewayName = checkoutSession?.gatewayName;
  }
  if (!resolvedGatewayName) {
    const session = await PaymentCheckoutSession.findOne({ gatewayOrderId }).sort({ createdAt: -1 });
    resolvedGatewayName = session?.gatewayName;
  }
  if (!resolvedGatewayName) {
    resolvedGatewayName = (await PaymentFactory.getActive(platform)).doc.gatewayName;
  }

  const session =
    checkoutSession ||
    (await PaymentCheckoutSession.findOne({ gatewayOrderId, ...(customerId ? { customerId } : {}) }).sort({ createdAt: -1 }));

  const cid = customerId || session?.customerId;
  if (!cid) throw new Error("Customer context missing");

  const completed = await findCompletedPayment({ transactionId, gatewayOrderId });
  if (completed?.order) {
    return { success: true, duplicate: true, orderId: completed.order, payment: completed };
  }

  const { service } = loadGateway(await getGatewayDocByName(resolvedGatewayName));
  let payment =
    paymentRecord ||
    (transactionId ? await Payment.findOne({ transactionId }) : null) ||
    (await Payment.findOne({ gatewayOrderId }).sort({ createdAt: -1 }));

  const attempt = (payment?.verificationAttempts || 0) + 1;

  if (session && session.status !== CHECKOUT_SESSION_STATUS.COMPLETED) {
    session.status = CHECKOUT_SESSION_STATUS.PROCESSING;
    await session.save();
  }

  try {
    const verified = await service.verifyPayment({
      orderId: gatewayOrderId,
      paymentId: transactionId,
      signature,
      raw: { source },
    });

    if (!verified?.verified) throw new Error("Gateway verification failed");

    const customer = user || (await Customer.findById(cid));
    if (!customer) throw new Error("Customer not found");

    const addr = deliveryAddress || session?.deliveryAddress;
    assertAddress(addr);

    const db = await mongoose.startSession();
    db.startTransaction();
    try {
      const dup = await Payment.findOne({
        status: { $in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.COMPLETED] },
        order: { $exists: true, $ne: null },
        $or: [{ transactionId: verified.transactionId }, { gatewayOrderId }],
      }).session(db);
      if (dup?.order) {
        await db.commitTransaction();
        db.endSession();
        return { success: true, duplicate: true, orderId: dup.order };
      }

      const totals = await calculateCartTotals(cid, couponCode ?? session?.couponCode, db);
      if (verified.amount && Math.abs(verified.amount - totals.payableAmount) > 0.01) {
        throw new Error("Payment amount mismatch");
      }

      if (!payment) {
        payment = await createInitiatedPaymentRecord({
          gatewayName: resolvedGatewayName,
          payableAmount: totals.payableAmount,
          gatewayOrderId,
          user: customer,
          checkoutSessionId: session?.sessionId,
          session: db,
        });
      }

      payment.transactionId = verified.transactionId;
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.verificationSource = source;
      payment.verificationAttempts = attempt;
      payment.gatewayResponse = verified.raw || {};
      payment.paymentMethodType = verified.paymentMethodType || "unknown";
      await payment.save({ session: db });

      const { order, updatedUser } = await fulfillPaidOrder({
        customerId: cid,
        user: customer,
        orderItems: totals.orderItems,
        coupon: totals.coupon,
        totals,
        paymentRecord: payment,
        deliveryAddress: addr,
        deliveryDate: deliveryDate ?? session?.deliveryDate,
        notes: notes ?? session?.notes,
        transactionId: verified.transactionId,
        session: db,
      });

      if (session) {
        session.status = CHECKOUT_SESSION_STATUS.COMPLETED;
        session.paymentId = payment._id;
        session.nextVerificationAt = undefined;
        await session.save({ session: db });
      }

      await db.commitTransaction();
      db.endSession();
      return { success: true, orderId: order._id, order, user: updatedUser, payment };
    } catch (e) {
      await db.abortTransaction();
      db.endSession();
      throw e;
    }
  } catch (err) {
    if (payment) {
      payment.status = PAYMENT_STATUS.PENDING;
      payment.verificationAttempts = attempt;
      payment.nextVerificationAt =
        attempt < MAX_VERIFY_ATTEMPTS ? nextRetryAt(attempt) : undefined;
      await payment.save();
    }
    if (session && attempt < MAX_VERIFY_ATTEMPTS) {
      session.verificationAttempts = attempt;
      session.nextVerificationAt = nextRetryAt(attempt);
      await session.save();
    }
    return { success: false, processing: true, pending: true, message: err.message };
  }
}

// Bind for webhook module
webhookHandler.bindVerify(verifyPayment);

// ── Create payment (unified API) ──────────────────────────────────────────────

export async function create(customerId, user, body) {
  assertCustomer(user);

  const platform = normalizePlatform(body.platform || "website");
  const couponCode = body.couponCode;
  const deliveryAddress = body.deliveryAddress;
  const deliveryDate = body.deliveryDate;
  const notes = body.notes;

  if (deliveryAddress) assertAddress(deliveryAddress);

  const { doc, service } = await PaymentFactory.getActive(platform);
  const totals = await calculateCartTotals(customerId, couponCode);
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const apiBase = resolveApiBase(platform, body.apiPublicUrl);

  const defaultReturn =
    body.returnUrl ||
    (platform === "website"
      ? `${appConfig.websiteUrl}/payment-return`
      : body.returnUrl);
  const defaultCancel =
    body.cancelUrl ||
    (platform === "website"
      ? `${appConfig.websiteUrl}/payment-failed`
      : body.cancelUrl);

  const gatewayCheckout = await service.createPayment({
    amount: totals.payableAmount,
    sessionId,
    customer: { name: user.fullName, email: user.email, phone: user.mobile },
    returnUrl: defaultReturn,
    cancelUrl: defaultCancel,
    apiBaseUrl: apiBase,
    platform,
  });

  const payment = await createInitiatedPaymentRecord({
    gatewayName: doc.gatewayName,
    payableAmount: totals.payableAmount,
    gatewayOrderId: gatewayCheckout.gatewayOrderId,
    user,
    checkoutSessionId: sessionId,
  });
  payment.status = PAYMENT_STATUS.PENDING;
  payment.checkoutSessionId = sessionId;
  payment.nextVerificationAt = nextRetryAt(0);
  await payment.save();

  await PaymentCheckoutSession.create({
    sessionId,
    customerId,
    gatewayName: doc.gatewayName,
    gatewayOrderId: gatewayCheckout.gatewayOrderId,
    amount: totals.payableAmount,
    currency: "INR",
    couponCode,
    platform,
    returnUrl: defaultReturn,
    cancelUrl: defaultCancel,
    deliveryAddress,
    deliveryDate,
    notes,
    expiresAt,
    paymentId: payment._id,
    nextVerificationAt: nextRetryAt(0),
    metadata: {
      publicKey: gatewayCheckout.publicKey,
      amountPaise: gatewayCheckout.amountPaise,
      ...(gatewayCheckout.metadata || {}),
    },
  });

  const checkoutUrl = `${apiBase}/api/payment/page/${sessionId}`;

  return {
    success: true,
    paymentSession: {
      sessionId,
      expiresAt,
      payableAmount: totals.payableAmount,
      currency: "INR",
    },
    checkoutUrl,
    sdkData: null,
    payableAmount: totals.payableAmount,
  };
}

// ── Hosted checkout page + return (UX only) ───────────────────────────────────

export async function getCheckoutPage(sessionId, apiBaseUrl) {
  const session = await PaymentCheckoutSession.findOne({
    sessionId,
    status: { $in: [CHECKOUT_SESSION_STATUS.PENDING, CHECKOUT_SESSION_STATUS.PROCESSING] },
    expiresAt: { $gt: new Date() },
  });
  if (!session) throw new Error("Checkout session expired or not found");

  const { service } = loadGateway(await getGatewayDocByName(session.gatewayName));
  return {
    html: service.buildCheckoutPage({
      session,
      publicKey: session.metadata?.publicKey,
      gatewayOrderId: session.gatewayOrderId,
      amountPaise: session.metadata?.amountPaise || Math.round(session.amount * 100),
      currency: session.currency,
      apiBaseUrl,
    }),
    csp: service.getCspDirectives?.() || [],
  };
}

export async function handleReturn(sessionId, req) {
  const session = await PaymentCheckoutSession.findOne({
    sessionId,
    expiresAt: { $gt: new Date() },
  });
  if (!session) throw new Error("Checkout session expired or not found");

  const { service } = loadGateway(await getGatewayDocByName(session.gatewayName));
  const parsed = service.parseReturn(req);
  if (!parsed.gatewayOrderId) parsed.gatewayOrderId = session.gatewayOrderId;

  const rawStatus = String(
    parsed.status || parsed.raw?.status || req.query?.status || req.body?.status || ""
  ).toLowerCase();

  // Explicit cancel / fail from gateway client (before or instead of verify)
  if (["cancelled", "canceled", "user_cancelled"].includes(rawStatus)) {
    return {
      targetUrl: buildReturnUrl(session.cancelUrl || session.returnUrl, {
        status: "cancelled",
        sessionId: session.sessionId,
        reason: "Payment cancelled by customer",
      }),
      processing: false,
      failed: true,
    };
  }

  if (["failed", "failure", "error"].includes(rawStatus)) {
    return {
      targetUrl: buildReturnUrl(session.cancelUrl || session.returnUrl, {
        status: "failed",
        sessionId: session.sessionId,
        reason: parsed.reason || "Payment failed",
        transactionId: parsed.transactionId || "",
      }),
      processing: false,
      failed: true,
    };
  }

  // Already completed session — avoid duplicate processing / redirect loops
  if (session.status === CHECKOUT_SESSION_STATUS.COMPLETED && session.paymentId) {
    const paid = await Payment.findById(session.paymentId);
    if (paid?.order) {
      return {
        targetUrl: buildReturnUrl(session.returnUrl, {
          status: "success",
          orderId: String(paid.order),
          transactionId: paid.transactionId || "",
          amount: session.amount,
        }),
        processing: false,
      };
    }
  }

  const result = await verifyPayment({
    source: "redirect",
    gatewayName: session.gatewayName,
    gatewayOrderId: parsed.gatewayOrderId,
    transactionId: parsed.transactionId,
    signature: parsed.signature,
    customerId: session.customerId,
    checkoutSession: session,
    platform: session.platform,
    raw: parsed.raw,
  });

  if (result.success && result.orderId) {
    return {
      targetUrl: buildReturnUrl(session.returnUrl, {
        status: "success",
        orderId: String(result.orderId),
        transactionId: result.payment?.transactionId || parsed.transactionId || "",
        amount: session.amount,
      }),
      processing: false,
    };
  }

  // Still verifying — UX stays on payment-return / thanku until poll resolves
  return {
    targetUrl: buildReturnUrl(session.returnUrl, {
      status: "processing",
      sessionId: session.sessionId,
    }),
    processing: true,
  };
}

/**
 * Pollable session status for payment-return / app while webhook catches up.
 */
export async function getSessionStatus(sessionId) {
  const session = await PaymentCheckoutSession.findOne({ sessionId });
  if (!session) {
    return { success: false, status: "expired", message: "Session not found or expired" };
  }

  if (session.status === CHECKOUT_SESSION_STATUS.COMPLETED) {
    const payment = session.paymentId
      ? await Payment.findById(session.paymentId)
      : await Payment.findOne({ checkoutSessionId: sessionId }).sort({ createdAt: -1 });

    if (payment?.order) {
      return {
        success: true,
        status: "success",
        orderId: String(payment.order),
        transactionId: payment.transactionId || null,
        amount: session.amount,
        paymentMethod: payment.paymentMethodType || payment.method || null,
        gatewayName: session.gatewayName,
      };
    }
  }

  // Attempt a light server-side verify (idempotent) when still processing
  if (
    session.status !== CHECKOUT_SESSION_STATUS.COMPLETED &&
    session.expiresAt > new Date()
  ) {
    const result = await verifyPayment({
      source: "api",
      gatewayName: session.gatewayName,
      gatewayOrderId: session.gatewayOrderId,
      customerId: session.customerId,
      checkoutSession: session,
      platform: session.platform || "website",
    });

    if (result.success && result.orderId) {
      return {
        success: true,
        status: "success",
        orderId: String(result.orderId),
        transactionId: result.payment?.transactionId || null,
        amount: session.amount,
        gatewayName: session.gatewayName,
      };
    }

    if (result.processing || result.pending) {
      return {
        success: false,
        status: "processing",
        sessionId: session.sessionId,
        amount: session.amount,
        gatewayName: session.gatewayName,
      };
    }
  }

  if (session.expiresAt <= new Date()) {
    return {
      success: false,
      status: "failed",
      reason: "Payment session expired",
      sessionId: session.sessionId,
    };
  }

  return {
    success: false,
    status: "processing",
    sessionId: session.sessionId,
    amount: session.amount,
    gatewayName: session.gatewayName,
  };
}

// ── Scheduled retry (webhook delayed / user closed browser) ───────────────────

export async function runScheduledVerifications() {
  const due = await Payment.find({
    status: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING] },
    nextVerificationAt: { $lte: new Date() },
    gatewayOrderId: { $exists: true },
    verificationAttempts: { $lt: MAX_VERIFY_ATTEMPTS },
  }).limit(20);

  for (const p of due) {
    const session = await PaymentCheckoutSession.findOne({
      $or: [{ sessionId: p.checkoutSessionId }, { gatewayOrderId: p.gatewayOrderId }],
    }).sort({ createdAt: -1 });

    await verifyPayment({
      source: "scheduled",
      gatewayName: p.gatewayName,
      gatewayOrderId: p.gatewayOrderId,
      transactionId: p.transactionId,
      customerId: session?.customerId,
      checkoutSession: session,
      paymentRecord: p,
      platform: session?.platform || "website",
    });
  }
}

export function startRetryWorker(intervalMs = 60_000) {
  const tick = () => runScheduledVerifications().catch((e) => console.error("Payment retry:", e.message));
  tick();
  return setInterval(tick, intervalMs);
}

// ── Backward-compatible aliases ───────────────────────────────────────────────

export const generateCheckoutSession = create;
export async function getCheckoutSession(sessionId) {
  return PaymentCheckoutSession.findOne({ sessionId });
}

export async function getActiveGatewayInfo(platform) {
  const { doc, credentials } = await PaymentFactory.getActive(platform);
  return {
    displayName: doc.displayName,
    status: doc.status,
    mode: doc.mode,
    supportedPlatforms: doc.supportedPlatforms,
    publicKey: credentials.keyId,
  };
}

export async function saveFailedPayment(user, payload) {
  const mrPaymentId = await generateMRId("PAY", "PAYMENT");
  const gatewayOrderId = payload.gatewayOrderId || payload.razorpay_order_id;
  let gatewayName = payload.gatewayName;

  if (!gatewayName && gatewayOrderId) {
    const session = await PaymentCheckoutSession.findOne({ gatewayOrderId }).sort({ createdAt: -1 });
    gatewayName = session?.gatewayName;
  }
  if (!gatewayName) {
    gatewayName = (await PaymentFactory.getActive()).doc.gatewayName;
  }

  await Payment.create({
    amount: payload.amount || 0,
    method: String(gatewayName).toUpperCase(),
    gatewayName,
    mrPaymentId,
    gatewayOrderId,
    transactionId: payload.transactionId || payload.razorpay_payment_id,
    status: PAYMENT_STATUS.FAILED,
    failureReason: payload.reason || "Client reported failure",
    customer: { name: user?.fullName, email: user?.email, phone: user?.mobile },
    gatewayResponse: payload,
  });
  return { success: true };
}

/** Legacy POST /verify — server verifies; never trusts client status alone */
export async function verifyForCustomer(customerId, user, payload) {
  assertCustomer(user);

  const orderId = payload.gatewayOrderId || payload.razorpay_order_id;
  const paymentId = payload.transactionId || payload.razorpay_payment_id;
  const signature = payload.signature || payload.razorpay_signature;

  if (!orderId) throw new Error("Missing payment verification fields");

  const checkoutSession = await PaymentCheckoutSession.findOne({
    gatewayOrderId: orderId,
    customerId,
  }).sort({ createdAt: -1 });

  const result = await verifyPayment({
    source: "api",
    gatewayName: payload.gatewayName || checkoutSession?.gatewayName,
    gatewayOrderId: orderId,
    transactionId: paymentId,
    signature,
    customerId,
    user,
    deliveryAddress: payload.deliveryAddress,
    couponCode: payload.couponCode ?? checkoutSession?.couponCode,
    deliveryDate: payload.deliveryDate ?? checkoutSession?.deliveryDate,
    notes: payload.notes ?? checkoutSession?.notes,
    platform: payload.platform || checkoutSession?.platform || "website",
    checkoutSession,
  });

  if (!result.success) {
    if (result.processing || result.pending) {
      return {
        success: false,
        processing: true,
        message: "Payment is being verified on the server. Please wait for confirmation.",
      };
    }
    throw new Error(result.message || "Payment verification failed");
  }

  return {
    success: true,
    message: "Payment successful",
    orderId: result.orderId,
    order: result.order,
    user: result.user,
    duplicate: result.duplicate || false,
  };
}

/** Legacy POST /create-order — redirects to hosted checkout (no gateway SDK on client) */
export async function createOrder(customerId, opts = {}) {
  const result = await create(customerId, opts.user, {
    ...opts,
    platform: opts.platform || "website",
  });
  return {
    success: true,
    checkoutUrl: result.checkoutUrl,
    paymentSession: result.paymentSession,
    sdkData: result.sdkData,
    payableAmount: result.payableAmount,
  };
}

export const renderCheckoutPage = getCheckoutPage;
export const handlePaymentReturn = handleReturn;

export { handleWebhook } from "./webhook.js";

export default {
  create,
  createOrder,
  verifyPayment,
  verifyForCustomer,
  handleReturn,
  getCheckoutPage,
  renderCheckoutPage,
  handlePaymentReturn,
  getSessionStatus,
  runScheduledVerifications,
  startRetryWorker,
  generateCheckoutSession: create,
  getActiveGatewayInfo,
  saveFailedPayment,
  getCheckoutSession,
  handleWebhook: webhookHandler.handleWebhook,
};
