/**
 * Single source of truth for payment gateway registration.
 *
 * To add a new gateway:
 * 1. Create backend/src/services/payment/gateways/<name>Gateway.js
 * 2. Import and register it in GATEWAY_REGISTRY below
 * 3. Add env vars to backend/.env.example
 * 4. Seed or configure the gateway in Admin Panel
 * 5. Activate it from Admin — no website/app changes required
 */

/** Gateways with a working driver in gateways/ */
export const IMPLEMENTED_GATEWAY_KEYS = Object.freeze([
  "razorpay",
  "cashfree",
  "phonepe",
  "payu",
  "easebuzz",
  "paytm",
  "stripe",
]);

/** All gateway names available in Admin (seeded; unimplemented use UnimplementedGateway) */
export const ALL_SUPPORTED_GATEWAY_NAMES = Object.freeze([
  "Razorpay",
  "PhonePe",
  "Cashfree",
  "PayU",
  "Easebuzz",
  "CCAvenue",
  "BillDesk",
  "Juspay",
  "Paytm",
  "Stripe",
  "Airpay",
  "Zaakpay",
  "Instamojo",
  "BharatX",
  "PineLabs",
  "AmazonPay",
]);

export function listSupportedGatewayNames() {
  return [...ALL_SUPPORTED_GATEWAY_NAMES];
}

export function isGatewayImplemented(gatewayName) {
  return IMPLEMENTED_GATEWAY_KEYS.includes(
    String(gatewayName || "").trim().toLowerCase()
  );
}
