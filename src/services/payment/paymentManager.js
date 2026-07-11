/**
 * =============================================================================
 * PAYMENT MANAGER — Single consolidated payment module
 * =============================================================================
 * Merges gateway implementations, credential resolution, validation, cart
 * calculation, order fulfillment, and payment orchestration.
 * =============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";
import mongoose from "mongoose";

import { config } from "../../config/config.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../constants/enums.js";
import { generateMRId } from "../../utils/mrId.js";
import {
  validateGatewayConfig,
} from "./gatewayCredentials.js";
import {
  appendQuery,
  buildReturnQuery,
} from "./gateways/checkoutPageUtils.js";
import {
  listSupportedGatewayNames,
} from "./gatewayRegistry.config.js";
import {
  assertPlatformMatchesSession,
  assertWebsiteOnlyCreateOrder,
  normalizePlatform,
  resolveCheckoutApiBaseUrl,
  sanitizeCheckoutSessionResponse,
  validatePlatformCheckoutPayload,
} from "./platformPaymentPolicy.js";
import {
  createGatewayInstance,
  getActiveGateway,
  getGatewayByName,
  getGatewayByNameInstance,
  resolvePublicKey,
} from "./gateways/index.js";
import {
  buildDeepLinkRedirectHtml,
  escapeHtml,
  setPaymentPageHeaders,
} from "./gateways/checkoutPageUtils.js";

import Cart from "../../models/Cart.model.js";
import Coupon from "../../models/Coupon.model.js";
import CouponUsage from "../../models/CouponUsage.model.js";
import Customer from "../../models/Customer.js";
import Order from "../../models/Order.model.js";
import Payment from "../../models/Payment.model.js";
import Product from "../../models/Product.model.js";
import StoreModel from "../../models/Store.model.js";
import PaymentWebhookLog from "../../models/PaymentWebhookLog.model.js";
import PaymentCheckoutSession, {
  CHECKOUT_SESSION_STATUS,
} from "../../models/PaymentCheckoutSession.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — see gatewayRegistry.config.js to add gateways
// ─────────────────────────────────────────────────────────────────────────────

export { listSupportedGatewayNames } from "./gatewayRegistry.config.js";

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS — Validation
// ─────────────────────────────────────────────────────────────────────────────

function validateAmount(amount, currency = "INR") {
  const num = Number(amount);

  if (!Number.isFinite(num) || num <= 0) {
    throw new Error("Invalid payment amount");
  }

  if (currency !== "INR") {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  return Number(num.toFixed(2));
}

function validateDeliveryAddress(address) {
  if (!address) {
    throw new Error("Delivery address is required");
  }

  if (!address.latitude || !address.longitude) {
    throw new Error("Valid delivery address with coordinates is required");
  }

  if (!address.fullAddress?.trim()) {
    throw new Error("Full address is required");
  }

  if (!address.mobile?.trim()) {
    throw new Error("Mobile number is required");
  }

  return true;
}

function validateCustomer(user) {
  if (!user?._id) {
    throw new Error("Customer authentication required");
  }
  return true;
}

function buildIdempotencyKey(...parts) {
  return parts.filter(Boolean).join(":");
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS — Cart & Order Calculation
// ─────────────────────────────────────────────────────────────────────────────

async function calculateCartTotals(customerId, couponCode, session = null) {
  const cartQuery = Cart.findOne({ customerId }).populate("items.productId");

  if (session) cartQuery.session(session);

  const cart = await cartQuery;

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  let totalAmount = 0;
  let gstAmount = 0;
  let discountAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.productId;

    if (!product) {
      throw new Error("Product not found in cart");
    }

    const variant = product.variants.id(item.variantId);

    if (!variant || !variant.isActive) {
      throw new Error(`Variant not available for ${product.name}`);
    }

    const qty = Number(item.qty) || 0;
    const price = Number(variant.sellingPrice) || 0;

    if (price <= 0 || qty <= 0) {
      throw new Error("Invalid price or quantity");
    }

    if (variant.stockQty < qty) {
      throw new Error(`${product.name} (${variant.value}) out of stock`);
    }

    const itemTotal = price * qty;
    const itemGST = (itemTotal * Number(product.gstPercent || 0)) / 100;

    totalAmount += itemTotal;
    gstAmount += itemGST;

    const layer = item.layer
      ? {
          ...(item.layer.toObject?.() || item.layer),
          isCustomized: !!item.layer?.text?.trim(),
        }
      : {
          area: "none",
          isCustomized: false,
          image:
            product.images?.[0] ||
            product.customization?.layers?.[0]?.image ||
            null,
        };

    orderItems.push({
      productId: product._id,
      variantId: variant._id,
      productName: product.name,
      variantLabel: variant.value,
      sellingPrice: price,
      qty,
      gstPercent: product.gstPercent || 0,
      layer,
      _product: product,
      _variant: variant,
    });
  }

  let coupon = null;

  if (couponCode) {
    const couponQuery = Coupon.findOne({
      code: couponCode.toUpperCase(),
      status: "ACTIVE",
    });

    if (session) couponQuery.session(session);

    coupon = await couponQuery;

    if (!coupon) {
      throw new Error("Invalid coupon");
    }

    const now = new Date();

    if (now < coupon.startDate || now > coupon.endDate) {
      throw new Error("Coupon expired");
    }

    if (totalAmount < coupon.minOrderAmount) {
      throw new Error("Minimum order amount not reached");
    }

    const usageQuery = CouponUsage.findOne({
      coupon: coupon._id,
      user: customerId,
    });

    if (session) usageQuery.session(session);

    const alreadyUsed = await usageQuery;

    if (alreadyUsed) {
      throw new Error("You already used this coupon");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("Coupon usage limit reached");
    }

    if (coupon.type === "PERCENT") {
      discountAmount = (totalAmount * coupon.value) / 100;

      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.value;
    }

    discountAmount = Math.min(discountAmount, totalAmount);
    discountAmount = Number(discountAmount.toFixed(2));
  }

  const payableAmount = Number(
    (totalAmount + gstAmount - discountAmount).toFixed(2)
  );

  return {
    cart,
    orderItems,
    coupon,
    totalAmount: Number(totalAmount.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    discountAmount,
    payableAmount,
  };
}

async function decrementStock(orderItems, session) {
  for (const item of orderItems) {
    const product = item._product;
    const variant = item._variant;

    const stockUpdate = await Product.updateOne(
      {
        _id: product._id,
        "variants._id": variant._id,
        "variants.stockQty": { $gte: item.qty },
      },
      { $inc: { "variants.$.stockQty": -item.qty } },
      { session }
    );

    if (stockUpdate.modifiedCount === 0) {
      throw new Error(`Stock update failed for ${product.name}`);
    }
  }
}

function stripInternalOrderItems(orderItems) {
  return orderItems.map(
    ({ _product, _variant, productId, variantId, ...rest }) => rest
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS — Order Fulfillment
// ─────────────────────────────────────────────────────────────────────────────

async function fulfillPaidOrder({
  customerId,
  user,
  orderItems,
  coupon,
  totals,
  paymentRecord,
  deliveryAddress,
  deliveryDate,
  notes,
  transactionId,
  session,
}) {
  await decrementStock(orderItems, session);

  let isNewAddress = true;

  const existingAddress = user.addresses?.find(
    (addr) =>
      addr.fullAddress === deliveryAddress.fullAddress &&
      addr.mobile === deliveryAddress.mobile &&
      addr.city === deliveryAddress.city &&
      addr.state === deliveryAddress.state &&
      addr.pincode === deliveryAddress.pincode &&
      addr.type === deliveryAddress.type
  );

  if (existingAddress) isNewAddress = false;

  if (isNewAddress) {
    await Customer.updateOne(
      { _id: customerId },
      {
        $push: {
          addresses: {
            ...deliveryAddress,
            location: {
              type: "Point",
              coordinates: [
                deliveryAddress.longitude,
                deliveryAddress.latitude,
              ],
            },
          },
        },
      },
      { session }
    );
  }

  const nearestStore = await StoreModel.findOne({
    "address.location": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [
            deliveryAddress.longitude,
            deliveryAddress.latitude,
          ],
        },
        $maxDistance: 20000000,
      },
    },
  });

  const mrOrderId = await generateMRId("ORD", "ORDER");

  const orderArr = await Order.create(
    [
      {
        mrOrderId,
        customerId,
        store: nearestStore?._id,
        items: stripInternalOrderItems(orderItems),
        totalAmount: totals.totalAmount,
        gstAmount: totals.gstAmount,
        discountAmount: totals.discountAmount,
        payableAmount: totals.payableAmount,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentModuleId: paymentRecord?.mrPaymentId || paymentRecord?._id,
        transactionId,
        deliveryAddress: {
          ...deliveryAddress,
          location: {
            type: "Point",
            coordinates: [
              deliveryAddress.longitude,
              deliveryAddress.latitude,
            ],
          },
        },
        notes,
        deliveryDate,
        status: ORDER_STATUS.PLACED,
      },
    ],
    { session }
  );

  const order = orderArr[0];

  paymentRecord.order = order._id;
  await paymentRecord.save({ session });

  if (coupon) {
    await CouponUsage.create(
      [{ coupon: coupon._id, user: customerId }],
      { session }
    );

    await Coupon.updateOne(
      { _id: coupon._id },
      { $inc: { usedCount: 1 } },
      { session }
    );
  }

  await Cart.updateOne(
    { customerId },
    { $set: { items: [] } },
    { session }
  );

  const updatedUser = await Customer.findById(customerId).session(session);

  return { order, updatedUser };
}

async function createSuccessPaymentRecord({
  gatewayName,
  payableAmount,
  gatewayOrderId,
  transactionId,
  paymentMethodType,
  user,
  gatewayResponse,
  session,
}) {
  const mrPaymentId = await generateMRId("PAY", "PAYMENT");

  const paymentArr = await Payment.create(
    [
      {
        amount: payableAmount,
        method: gatewayName.toUpperCase(),
        gatewayName,
        paymentMethodType,
        mrPaymentId,
        gatewayOrderId,
        transactionId,
        status: PAYMENT_STATUS.SUCCESS,
        customer: {
          name: user.fullName || user.name,
          email: user.email,
          phone: user.mobile,
        },
        gatewayResponse,
      },
    ],
    { session }
  );

  return paymentArr[0];
}

async function assertNoDuplicatePayment(transactionId, session = null) {
  const query = Payment.findOne({ transactionId });
  if (session) query.session(session);

  const existing = await query;

  if (existing) {
    throw new Error("Payment already processed");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT SERVICE — Main orchestration class
// ─────────────────────────────────────────────────────────────────────────────

class PaymentService {
  async _resolveGateway(platform = "website") {
    const gatewayDoc = await getActiveGateway(platform);
    validateGatewayConfig(gatewayDoc, platform);
    const gateway = createGatewayInstance(gatewayDoc);
    return { gatewayDoc, gateway };
  }

  async _resolveGatewayForPayment({
    platform = "website",
    gatewayName,
    gatewayOrderId,
  } = {}) {
    if (gatewayName) {
      const gatewayDoc = await getGatewayByName(gatewayName);
      validateGatewayConfig(gatewayDoc, platform);
      return { gatewayDoc, gateway: createGatewayInstance(gatewayDoc) };
    }

    if (gatewayOrderId) {
      const checkoutSession = await PaymentCheckoutSession.findOne({
        gatewayOrderId,
      }).sort({ createdAt: -1 });

      if (checkoutSession?.gatewayName) {
        const gatewayDoc = await getGatewayByName(checkoutSession.gatewayName);
        validateGatewayConfig(gatewayDoc, checkoutSession.platform || platform);
        return { gatewayDoc, gateway: createGatewayInstance(gatewayDoc) };
      }
    }

    return this._resolveGateway(platform);
  }

  // ── Payment Creation ──────────────────────────────────────────────────────

  async createOrder(customerId, { couponCode, platform = "website", user, returnUrl, cancelUrl } = {}) {
    const normalizedPlatform = normalizePlatform(platform);
    assertWebsiteOnlyCreateOrder(normalizedPlatform);

    const { gatewayDoc, gateway } = await this._resolveGateway(normalizedPlatform);
    const totals = await calculateCartTotals(customerId, couponCode);

    validateAmount(totals.payableAmount);

    const sessionId = crypto.randomUUID();
    const customer = {
      name: user?.fullName || user?.name,
      email: user?.email,
      phone: user?.mobile,
    };

    const websiteReturnUrl =
      returnUrl || `${config.websiteUrl}/payment-return`;
    const websiteCancelUrl =
      cancelUrl || `${config.websiteUrl}/checkout?payment=cancelled`;

    let checkout;
    let orderRaw = null;

    try {
      const orderResult = await gateway.createOrder({
        amount: totals.payableAmount,
        currency: "INR",
        receipt: sessionId,
        notes: { customerId: String(customerId) },
      });
      checkout = orderResult;
      orderRaw = orderResult.raw;
    } catch (error) {
      if (!/not implemented/i.test(error.message)) {
        throw error;
      }

      checkout = await gateway.generateCheckoutSession({
        amount: totals.payableAmount,
        currency: "INR",
        customer,
        sessionId,
        returnUrl: websiteReturnUrl,
        cancelUrl: websiteCancelUrl,
        apiBaseUrl: config.apiPublicUrl,
      });
      orderRaw = checkout.raw;
    }

    const clientCheckout = gateway.buildWebsiteClientCheckout({
      checkout,
      returnUrl: websiteReturnUrl,
      cancelUrl: websiteCancelUrl,
    });

    if (!clientCheckout?.mode) {
      throw new Error(
        `Gateway "${gatewayDoc.displayName}" does not support website checkout`
      );
    }

    return {
      success: true,
      order: orderRaw,
      gateway: {
        name: gatewayDoc.gatewayName,
        displayName: gatewayDoc.displayName,
        gatewayOrderId: checkout.gatewayOrderId,
        amount: checkout.amount,
        currency: checkout.currency,
      },
      clientCheckout,
      payableAmount: totals.payableAmount,
    };
  }

  async generateCheckoutSession(customerId, user, payload) {
    validateCustomer(user);

    const {
      couponCode,
      platform: requestedPlatform = "android",
      returnUrl,
      cancelUrl,
      deliveryAddress,
      deliveryDate,
      notes,
      apiPublicUrl,
    } = payload;

    const {
      platform,
      returnUrl: safeReturnUrl,
      cancelUrl: safeCancelUrl,
    } = validatePlatformCheckoutPayload(requestedPlatform, {
      returnUrl,
      cancelUrl,
    });

    if (deliveryAddress) {
      validateDeliveryAddress(deliveryAddress);
    }

    const { gatewayDoc, gateway } = await this._resolveGateway(platform);
    const totals = await calculateCartTotals(customerId, couponCode);

    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const baseUrl = resolveCheckoutApiBaseUrl(platform, apiPublicUrl);

    const checkout = await gateway.generateCheckoutSession({
      amount: totals.payableAmount,
      currency: "INR",
      customer: {
        name: user.fullName,
        email: user.email,
        phone: user.mobile,
      },
      sessionId,
      returnUrl: safeReturnUrl,
      cancelUrl: safeCancelUrl,
      apiBaseUrl: baseUrl,
    });

    await PaymentCheckoutSession.create({
      sessionId,
      customerId,
      gatewayName: gatewayDoc.gatewayName,
      gatewayOrderId: checkout.gatewayOrderId,
      amount: totals.payableAmount,
      currency: "INR",
      couponCode,
      platform,
      returnUrl: safeReturnUrl,
      cancelUrl: safeCancelUrl,
      deliveryAddress,
      deliveryDate,
      notes,
      expiresAt,
      metadata: {
        publicKey: checkout.publicKey,
        amountPaise: checkout.amount,
        ...(checkout.metadata || {}),
      },
    });

    const checkoutUrl = `${baseUrl}/api/payment/page/${sessionId}`;

    return sanitizeCheckoutSessionResponse({
      success: true,
      sessionId,
      checkoutUrl,
      payableAmount: totals.payableAmount,
      expiresAt,
    });
  }

  async getCheckoutPageData(sessionId) {
    const session = await PaymentCheckoutSession.findOne({
      sessionId,
      status: CHECKOUT_SESSION_STATUS.PENDING,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new Error("Checkout session expired or not found");
    }

    const gateway = await getGatewayByNameInstance(session.gatewayName);
    const publicKey = session.metadata?.publicKey || gateway.getPublicKey();

    if (!session.gatewayOrderId) {
      throw new Error("Gateway order was not created for this session");
    }

    if (!publicKey) {
      throw new Error("Active gateway public key is not configured");
    }

    return {
      session,
      publicKey,
      gatewayOrderId: session.gatewayOrderId,
      amount: session.amount,
      amountPaise:
        session.metadata?.amountPaise || Math.round(session.amount * 100),
      currency: session.currency,
      gatewayName: session.gatewayName,
    };
  }

  async renderCheckoutPage(sessionId, apiBaseUrl) {
    const data = await this.getCheckoutPageData(sessionId);
    const gateway = await getGatewayByNameInstance(data.gatewayName);

    return {
      html: gateway.buildCheckoutPageHtml({ ...data, apiBaseUrl }),
      cspDirectives: gateway.getCspDirectives?.() || [],
    };
  }

  async getCheckoutSession(sessionId) {
    return PaymentCheckoutSession.findOne({ sessionId });
  }

  async _findOrderForPayment(transactionId) {
    if (!transactionId) return null;

    const payment = await Payment.findOne({ transactionId }).populate("order");
    if (payment?.order) {
      return payment.order;
    }

    return Order.findOne({ transactionId });
  }

  _buildAppReturnTarget(session, fields = {}) {
    const params = buildReturnQuery(fields);
    return appendQuery(session.returnUrl, params);
  }

  async _finalizeCheckoutPaymentReturn(session, parsed) {
    const user = await Customer.findById(session.customerId);

    if (!user) {
      throw new Error("Customer not found for checkout session");
    }

    const verifyPayload = {
      gatewayName: session.gatewayName,
      gatewayOrderId: parsed.gatewayOrderId,
      transactionId: parsed.transactionId,
      signature: parsed.signature || parsed.transactionId,
      razorpay_order_id: parsed.gatewayOrderId,
      razorpay_payment_id: parsed.transactionId,
      razorpay_signature: parsed.signature,
      deliveryAddress: session.deliveryAddress,
      couponCode: session.couponCode,
      deliveryDate: session.deliveryDate,
      notes: session.notes,
      platform: session.platform,
    };

    try {
      const result = await this.verifyPayment(
        session.customerId,
        user,
        verifyPayload
      );

      if (session.status === CHECKOUT_SESSION_STATUS.PENDING) {
        session.status = CHECKOUT_SESSION_STATUS.COMPLETED;
        await session.save();
      }

      return {
        orderId: String(result.orderId),
        targetUrl: this._buildAppReturnTarget(session, {
          status: "success",
          orderId: String(result.orderId),
        }),
      };
    } catch (error) {
      if (error.message === "Payment already processed") {
        const existingOrder = await this._findOrderForPayment(
          parsed.transactionId
        );

        if (existingOrder) {
          if (session.status === CHECKOUT_SESSION_STATUS.PENDING) {
            session.status = CHECKOUT_SESSION_STATUS.COMPLETED;
            await session.save();
          }

          return {
            orderId: String(existingOrder._id),
            duplicate: true,
            targetUrl: this._buildAppReturnTarget(session, {
              status: "success",
              orderId: String(existingOrder._id),
              duplicate: "true",
            }),
          };
        }
      }

      throw error;
    }
  }

  async handlePaymentReturn(sessionId, req = {}) {
    const session = await PaymentCheckoutSession.findOne({
      sessionId,
      status: CHECKOUT_SESSION_STATUS.PENDING,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new Error("Checkout session expired or not found");
    }

    const gateway = await getGatewayByNameInstance(session.gatewayName);
    const parsed = gateway.parseReturnPayload(req);

    if (
      parsed.status === "cancelled" ||
      req.query?.status === "cancelled" ||
      req.body?.status === "cancelled"
    ) {
      throw new Error("Payment cancelled");
    }

    if (!parsed.gatewayOrderId || !parsed.transactionId) {
      throw new Error("Missing payment return fields");
    }

    if (!session.returnUrl) {
      throw new Error("Return URL not configured for this checkout session");
    }

    const finalized = await this._finalizeCheckoutPaymentReturn(session, parsed);

    return {
      returnUrl: session.returnUrl,
      cancelUrl: session.cancelUrl,
      orderId: finalized.orderId,
      paymentId: parsed.transactionId,
      signature: parsed.signature || parsed.transactionId,
      targetUrl: finalized.targetUrl,
      duplicate: finalized.duplicate || false,
    };
  }

  async completeCheckoutSession(sessionId, verifyPayload, user) {
    const session = await PaymentCheckoutSession.findOne({
      sessionId,
      status: CHECKOUT_SESSION_STATUS.PENDING,
    });

    if (!session) {
      throw new Error("Checkout session not found");
    }

    const result = await this.verifyPayment(session.customerId, user, {
      ...verifyPayload,
      gatewayName: session.gatewayName,
      gatewayOrderId: verifyPayload.gatewayOrderId || session.gatewayOrderId,
      couponCode: session.couponCode,
      deliveryAddress: verifyPayload.deliveryAddress || session.deliveryAddress,
      deliveryDate: verifyPayload.deliveryDate || session.deliveryDate,
      notes: verifyPayload.notes || session.notes,
      platform: session.platform,
    });

    session.status = CHECKOUT_SESSION_STATUS.COMPLETED;
    await session.save();

    return result;
  }

  // ── Verification ────────────────────────────────────────────────────────────

  async verifyPayment(customerId, user, payload) {
    validateCustomer(user);
    validateDeliveryAddress(payload.deliveryAddress);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      deliveryAddress,
      couponCode,
      deliveryDate,
      notes,
      platform: requestedPlatform = "website",
    } = payload;

    const orderId = razorpay_order_id || payload.gatewayOrderId;
    const paymentId = razorpay_payment_id || payload.transactionId;
    const signature = razorpay_signature || payload.signature;

    if (!orderId || !paymentId) {
      throw new Error("Missing payment verification fields");
    }

    const checkoutSession = await PaymentCheckoutSession.findOne({
      gatewayOrderId: orderId,
      customerId,
    }).sort({ createdAt: -1 });

    const platform = checkoutSession
      ? checkoutSession.platform
      : normalizePlatform(requestedPlatform);

    if (checkoutSession && requestedPlatform) {
      assertPlatformMatchesSession(requestedPlatform, checkoutSession.platform);
    }

    const { gatewayDoc, gateway } = await this._resolveGatewayForPayment({
      platform,
      gatewayName: payload.gatewayName || checkoutSession?.gatewayName,
      gatewayOrderId: orderId,
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await assertNoDuplicatePayment(paymentId, session);

      const verified = await gateway.verifyPayment({
        orderId,
        paymentId,
        signature: signature || paymentId,
        raw: payload,
      });

      const totals = await calculateCartTotals(
        customerId,
        couponCode,
        session
      );

      validateAmount(totals.payableAmount);

      if (
        verified.amount &&
        Math.abs(verified.amount - totals.payableAmount) > 0.01
      ) {
        throw new Error("Payment amount mismatch");
      }

      const paymentRecord = await createSuccessPaymentRecord({
        gatewayName: gatewayDoc.gatewayName,
        payableAmount: totals.payableAmount,
        gatewayOrderId: orderId,
        transactionId: paymentId,
        paymentMethodType: verified.paymentMethodType,
        user,
        gatewayResponse: {
          gatewayOrderId: orderId,
          transactionId: paymentId,
          signature,
          payment_method: verified.raw,
          gatewayName: gatewayDoc.gatewayName,
        },
        session,
      });

      const { order, updatedUser } = await fulfillPaidOrder({
        customerId,
        user,
        orderItems: totals.orderItems,
        coupon: totals.coupon,
        totals,
        paymentRecord,
        deliveryAddress,
        deliveryDate,
        notes,
        transactionId: paymentId,
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: "Payment successful",
        orderId: order._id,
        order,
        user: updatedUser,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async saveFailedPayment(user, payload) {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      reason,
      amount,
      platform: requestedPlatform = "website",
    } = payload;

    const gatewayOrderId =
      razorpay_order_id || payload.gatewayOrderId;
    const transactionId =
      razorpay_payment_id || payload.transactionId;

    const checkoutSession = gatewayOrderId
      ? await PaymentCheckoutSession.findOne({ gatewayOrderId }).sort({
          createdAt: -1,
        })
      : null;

    const platform = checkoutSession
      ? checkoutSession.platform
      : normalizePlatform(requestedPlatform);

    if (checkoutSession && requestedPlatform) {
      assertPlatformMatchesSession(requestedPlatform, checkoutSession.platform);
    }

    const { gatewayDoc, gateway } = await this._resolveGatewayForPayment({
      platform,
      gatewayName: payload.gatewayName || checkoutSession?.gatewayName,
      gatewayOrderId,
    });

    let paymentMethodType = "unknown";

    if (transactionId && gateway.getPaymentStatus) {
      try {
        const status = await gateway.getPaymentStatus({
          paymentId: transactionId,
        });
        paymentMethodType = status.raw?.method || "unknown";
      } catch {
        /* ignore fetch failure */
      }
    }

    const mrPaymentId = await generateMRId("PAY", "PAYMENT");

    const payment = await Payment.create({
      amount: amount || 0,
      method: gatewayDoc.gatewayName.toUpperCase(),
      paymentMethodType,
      mrPaymentId,
      gatewayOrderId,
      transactionId,
      status: PAYMENT_STATUS.FAILED,
      failureReason: reason,
      customer: {
        name: user?.fullName || user?.name,
        email: user?.email,
        phone: user?.mobile,
      },
      gatewayResponse: payload,
    });

    return { success: true, payment };
  }

  // ── Gateway Info ────────────────────────────────────────────────────────────

  async getActiveGatewayInfo(platform = "website") {
    const gatewayDoc = await getActiveGateway(platform);

    return {
      gatewayName: gatewayDoc.gatewayName,
      displayName: gatewayDoc.displayName,
      status: gatewayDoc.status,
      mode: gatewayDoc.mode,
      publicKey: resolvePublicKey(gatewayDoc),
      supportedPlatforms: gatewayDoc.supportedPlatforms,
      supportedPaymentTypes: gatewayDoc.supportedPaymentTypes,
      webhookEnabled: gatewayDoc.webhookEnabled,
    };
  }

  // ── Webhooks ────────────────────────────────────────────────────────────────

  async handleWebhook(gatewayName, req) {
    const gatewayDoc = await getGatewayByName(gatewayName);
    validateGatewayConfig(gatewayDoc);

    const gateway = createGatewayInstance(gatewayDoc);
    const verification = gateway.verifyWebhookSignature(req);

    const event = req.body;
    const idempotencyKey = buildIdempotencyKey(
      gatewayName,
      event?.event,
      verification.eventId || event?.payload?.payment?.entity?.id
    );

    const existing = await PaymentWebhookLog.findOne({ idempotencyKey });

    if (existing?.processed) {
      return { success: true, duplicate: true };
    }

    const log = await PaymentWebhookLog.create({
      gatewayName,
      eventType: event?.event || "unknown",
      eventId: verification.eventId,
      gatewayOrderId: event?.payload?.payment?.entity?.order_id,
      transactionId: event?.payload?.payment?.entity?.id,
      payload: event,
      signatureValid: verification.valid,
      idempotencyKey,
    });

    if (!verification.valid) {
      log.processingError = "Invalid webhook signature";
      await log.save();
      throw new Error("Invalid webhook signature");
    }

    const parsed = await gateway.handleWebhookEvent(event);
    log.processed = true;
    await log.save();

    return { success: true, event: parsed, log };
  }

  // ── Refunds & Status ────────────────────────────────────────────────────────

  async refund({ paymentId, amount, gatewayName }) {
    const gateway = gatewayName
      ? await getGatewayByNameInstance(gatewayName)
      : (await this._resolveGateway()).gateway;

    return gateway.refund({ paymentId, amount });
  }

  async getPaymentStatus({ paymentId, gatewayName }) {
    const gateway = gatewayName
      ? await getGatewayByNameInstance(gatewayName)
      : (await this._resolveGateway()).gateway;

    return gateway.getPaymentStatus({ paymentId });
  }

  async capturePayment({ paymentId, amount, gatewayName }) {
    const gateway = gatewayName
      ? await getGatewayByNameInstance(gatewayName)
      : (await this._resolveGateway()).gateway;

    return gateway.capturePayment({ paymentId, amount });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  resolvePublicKey,
  getActiveGateway,
  getGatewayByName,
  createGatewayInstance,
  getGatewayByNameInstance,
} from "./gateways/index.js";

export {
  resolveGatewayCredentials,
  validateGatewayConfig,
} from "./gatewayCredentials.js";

export default new PaymentService();
