import PaymentGateway, {
  GATEWAY_MODE,
  GATEWAY_STATUS,
} from "../../../models/PaymentGateway.model.js";
import {
  resolveGatewayCredentials,
  validateGatewayConfig,
} from "../gatewayCredentials.js";
import { isGatewayImplemented } from "../gatewayRegistry.config.js";
import { BaseGateway, UnimplementedGateway } from "./baseGateway.js";
import { RazorpayGateway } from "./razorpayGateway.js";
import { CashfreeGateway } from "./cashfreeGateway.js";
import { PayUGateway } from "./payuGateway.js";
import { PhonePeGateway } from "./phonepeGateway.js";
import { EasebuzzGateway } from "./easebuzzGateway.js";
import { PaytmGateway } from "./paytmGateway.js";
import { StripeGateway } from "./stripeGateway.js";

/** Register new gateway drivers here only */
const GATEWAY_REGISTRY = {
  razorpay: RazorpayGateway,
  cashfree: CashfreeGateway,
  phonepe: PhonePeGateway,
  payu: PayUGateway,
  easebuzz: EasebuzzGateway,
  paytm: PaytmGateway,
  stripe: StripeGateway,
};

export function getGatewayRegistry() {
  return { ...GATEWAY_REGISTRY };
}

export function createGatewayInstance(gatewayDoc) {
  const credentials = resolveGatewayCredentials(gatewayDoc);
  const key = gatewayDoc.gatewayName?.toLowerCase();
  const GatewayClass =
    GATEWAY_REGISTRY[key] ||
    (isGatewayImplemented(key) ? UnimplementedGateway : UnimplementedGateway);

  return new GatewayClass(gatewayDoc, credentials);
}

export async function getActiveGateway(platform = "website") {
  let gateway = await PaymentGateway.findOne({
    isDefault: true,
    status: GATEWAY_STATUS.ACTIVE,
    supportedPlatforms: platform,
  }).sort({ priority: 1 });

  if (!gateway) {
    gateway = await PaymentGateway.findOne({
      status: GATEWAY_STATUS.ACTIVE,
      supportedPlatforms: platform,
    }).sort({ priority: 1 });
  }

  if (!gateway) {
    throw new Error(
      `No active payment gateway configured for platform: ${platform}`
    );
  }

  return gateway;
}

export async function getGatewayByName(gatewayName) {
  const gateway = await PaymentGateway.findOne({
    gatewayName: { $regex: `^${gatewayName}$`, $options: "i" },
  });

  if (!gateway) {
    throw new Error(`Payment gateway "${gatewayName}" not found`);
  }

  return gateway;
}

export async function getGatewayByNameInstance(gatewayName) {
  const gatewayDoc = await getGatewayByName(gatewayName);
  return createGatewayInstance(gatewayDoc);
}

export function resolvePublicKey(gatewayDoc) {
  const creds = resolveGatewayCredentials(gatewayDoc);
  return creds.keyId;
}

export {
  BaseGateway,
  UnimplementedGateway,
  GATEWAY_MODE,
  GATEWAY_STATUS,
  validateGatewayConfig,
};
