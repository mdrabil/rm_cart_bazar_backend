/**
 * Payment factory — load active gateway or gateway by name.
 *
 * Usage:
 *   const gateway = await PaymentFactory.getActive("website");
 *   const gateway = await PaymentFactory.get("razorpay");
 */

import PaymentGateway, { GATEWAY_STATUS } from "../models/PaymentGateway.model.js";
import {
  resolveCredentials,
  assertGatewayActive,
} from "./config.js";

import createRazorpay from "./gateways/razorpay/service.js";
import createCashfree from "./gateways/cashfree/service.js";
import createPhonepe from "./gateways/phonepe/service.js";
import createPayu from "./gateways/payu/service.js";
import createEasebuzz from "./gateways/easebuzz/service.js";
import createPaytm from "./gateways/paytm/service.js";
import createStripe from "./gateways/stripe/service.js";

const BUILDERS = {
  razorpay: createRazorpay,
  cashfree: createCashfree,
  phonepe: createPhonepe,
  payu: createPayu,
  easebuzz: createEasebuzz,
  paytm: createPaytm,
  stripe: createStripe,
};

export const GATEWAY_LABELS = Object.freeze({
  razorpay: "Razorpay",
  razorpay: "default",
  cashfree: "Cashfree",
  phonepe: "PhonePe",
  payu: "PayU",
  easebuzz: "Easebuzz",
  paytm: "Paytm",
  stripe: "Stripe",
});

export function canonicalGatewayName(name) {
  const key = String(name || "").trim().toLowerCase();
  return GATEWAY_LABELS[key] || String(name || "").trim();
}

export function gatewayKey(name) {
  return String(name || "").trim().toLowerCase();
}

export function loadGateway(gatewayDoc) {
  const key = gatewayDoc.gatewayName?.toLowerCase();
  const build = BUILDERS[key];
  if (!build) {
    throw new Error(`Gateway driver not implemented: ${gatewayDoc.gatewayName}`);
  }
  const credentials = resolveCredentials(gatewayDoc);
  const service = build(credentials, gatewayDoc);
  return { doc: gatewayDoc, credentials, service };
}

export async function getActiveGatewayDoc(platform = "website") {
  let doc = await PaymentGateway.findOne({
    isDefault: true,
    status: GATEWAY_STATUS.ACTIVE,
    supportedPlatforms: platform,
  }).sort({ priority: 1 });

  if (!doc) {
    doc = await PaymentGateway.findOne({
      status: GATEWAY_STATUS.ACTIVE,
      supportedPlatforms: platform,
    }).sort({ priority: 1 });
  }

  if (!doc) throw new Error(`No active gateway for platform: ${platform}`);
  return doc;
}

export async function getGatewayDocByName(name) {
  const doc = await PaymentGateway.findOne({
    gatewayName: { $regex: `^${name}$`, $options: "i" },
  });
  if (!doc) throw new Error(`Gateway not found: ${name}`);
  return doc;
}

export function isGatewayImplemented(name) {
  return Boolean(BUILDERS[gatewayKey(name)]);
}

export const listSupportedGatewayNames = () =>
  Object.keys(BUILDERS).map((key) => GATEWAY_LABELS[key] || key);

const PaymentFactory = {
  async getActive(platform = "website") {
    const doc = await getActiveGatewayDoc(platform);
    assertGatewayActive(doc, platform);
    return loadGateway(doc);
  },

  async get(name) {
    const doc = await getGatewayDocByName(name);
    assertGatewayActive(doc);
    return loadGateway(doc);
  },

  async getDoc(name) {
    return getGatewayDocByName(name);
  },

  load: loadGateway,
  listImplemented: () => Object.keys(BUILDERS),
};

export default PaymentFactory;
