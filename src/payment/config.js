// /**
//  * Payment module configuration — credentials, status mapping, checkout page helpers.
//  * Single config file; no separate mapper/credentials/helper modules.
//  */

// import { config as appConfig } from "../config/config.js";
// import {
//   GATEWAY_MODE,
//   GATEWAY_STATUS,
// } from "../models/PaymentGateway.model.js";
// import { PAYMENT_STATUS } from "../constants/enums.js";

// // ── Retry schedule (server-side verification when webhook is delayed) ─────────
// export const VERIFY_RETRY_MS = [30_000, 120_000, 300_000, 900_000, 1_800_000, 3_600_000];
// export const MAX_VERIFY_ATTEMPTS = VERIFY_RETRY_MS.length;
// export const SESSION_TTL_MS = 30 * 60 * 1000;

// // ── Gateway status → internal status ─────────────────────────────────────────
// const STATUS_MAP = {
//   razorpay: { captured: PAYMENT_STATUS.SUCCESS, failed: PAYMENT_STATUS.FAILED, refunded: PAYMENT_STATUS.REFUNDED },
//   cashfree: { paid: PAYMENT_STATUS.SUCCESS, success: PAYMENT_STATUS.SUCCESS, failed: PAYMENT_STATUS.FAILED },
//   phonepe: { completed: PAYMENT_STATUS.SUCCESS, failed: PAYMENT_STATUS.FAILED },
//   payu: { success: PAYMENT_STATUS.SUCCESS, failure: PAYMENT_STATUS.FAILED },
//   easebuzz: { success: PAYMENT_STATUS.SUCCESS, failure: PAYMENT_STATUS.FAILED },
//   paytm: { txn_success: PAYMENT_STATUS.SUCCESS, txn_failure: PAYMENT_STATUS.FAILED },
//   stripe: { paid: PAYMENT_STATUS.SUCCESS, unpaid: PAYMENT_STATUS.PENDING },
// };

// export function mapStatus(gatewayName, raw) {
//   const key = String(raw || "").toLowerCase();
//   const mapped = STATUS_MAP[String(gatewayName).toLowerCase()]?.[key];
//   if (mapped) return mapped;
//   if (Object.values(PAYMENT_STATUS).includes(String(raw).toUpperCase())) {
//     return String(raw).toUpperCase();
//   }
//   return PAYMENT_STATUS.PENDING;
// }

// export function isPaidStatus(status) {
//   return status === PAYMENT_STATUS.SUCCESS || status === PAYMENT_STATUS.COMPLETED;
// }

// const PAYMENT_METHOD_TYPES = ["card", "upi", "netbanking", "wallet", "emi", "cod"];

// const GATEWAY_METHOD_MAP = {
//   cashfree: {
//     upi: "upi",
//     card: "card",
//     debit_card: "card",
//     credit_card: "card",
//     prepaid_card: "card",
//     net_banking: "netbanking",
//     nb: "netbanking",
//     wallet: "wallet",
//     app: "wallet",
//     paylater: "wallet",
//     emi: "emi",
//     card_emi: "emi",
//     cardless_emi: "emi",
//     banktransfer: "netbanking",
//   },
//   razorpay: {
//     card: "card",
//     upi: "upi",
//     netbanking: "netbanking",
//     wallet: "wallet",
//     emi: "emi",
//   },
//   phonepe: {
//     pay_page: "upi",
//     upi: "upi",
//     card: "card",
//   },
// };

// /** Map gateway-specific payment method to Payment.paymentMethodType enum. */
// export function normalizePaymentMethodType(raw, gatewayName = "") {
//   if (raw == null || raw === "" || raw === "unknown") return undefined;

//   let value = raw;
//   if (typeof value === "object") {
//     value = value.payment_group || Object.keys(value)[0];
//   }

//   const key = String(value).toLowerCase().replace(/[\s-]/g, "_");
//   if (PAYMENT_METHOD_TYPES.includes(key)) return key;

//   const mapped = GATEWAY_METHOD_MAP[String(gatewayName).toLowerCase()]?.[key];
//   if (mapped) return mapped;

//   if (key.includes("card")) return "card";
//   if (key.includes("upi")) return "upi";
//   if (key.includes("net") || key === "nb") return "netbanking";
//   if (key.includes("wallet") || key.includes("paytm") || key.includes("phonepe")) return "wallet";
//   if (key.includes("emi")) return "emi";

//   return undefined;
// }

// // ── Credentials from DB env names → process.env ───────────────────────────────
// export function resolveCredentials(gatewayDoc) {
//   if (!gatewayDoc) throw new Error("Payment gateway not configured");

//   const isProd =
//     gatewayDoc.mode === GATEWAY_MODE.PRODUCTION ||
//     appConfig.nodeEnv === "production";

//   const keyIdEnv = isProd ? gatewayDoc.productionKeyIdEnv : gatewayDoc.developmentKeyIdEnv;
//   const secretEnv = isProd ? gatewayDoc.productionSecretEnv : gatewayDoc.developmentSecretEnv;
//   const merchantIdEnv = isProd ? gatewayDoc.productionMerchantIdEnv : gatewayDoc.developmentMerchantIdEnv;

//   if (!keyIdEnv || !secretEnv) {
//     throw new Error(`Gateway "${gatewayDoc.gatewayName}" missing credential env config`);
//   }

//   const keyId = process.env[keyIdEnv];
//   const secret = process.env[secretEnv];
//   if (!keyId || !secret) {
//     throw new Error(`Missing .env values: ${keyIdEnv}, ${secretEnv}`);
//   }

//   return {
//     keyId,
//     secret,
//     merchantId: merchantIdEnv ? process.env[merchantIdEnv] : undefined,
//     webhookSecret: gatewayDoc.webhookSecretEnv
//       ? process.env[gatewayDoc.webhookSecretEnv]
//       : undefined,
//     webhookUrl: resolveWebhookUrl(gatewayDoc),
//     mode: isProd ? GATEWAY_MODE.PRODUCTION : GATEWAY_MODE.DEVELOPMENT,
//   };
// }

// /**
//  * Webhook URL priority:
//  * 1. Custom URL saved on gateway (admin panel)
//  * 2. Full URL from .env via webhookUrlEnv
//  * 3. PAYMENT_WEBHOOK_BASE_URL (or API_PUBLIC_URL) + /api/payment/webhook/:gateway
//  * 4. null — payments still work via server-side verification
//  */
// export function resolveWebhookUrl(gatewayDoc) {
//   if (!gatewayDoc) return null;

//   const custom = String(gatewayDoc.webhookUrl || "").trim();
//   if (custom) return custom.replace(/\/$/, "");

//   const envName = String(gatewayDoc.webhookUrlEnv || "").trim();
//   if (envName && process.env[envName]) {
//     return String(process.env[envName]).trim().replace(/\/$/, "");
//   }

//   const base = String(appConfig.paymentWebhookBaseUrl || "").trim().replace(/\/$/, "");
//   if (!base) return null;

//   const name = String(gatewayDoc.gatewayName || "").trim().toLowerCase();
//   if (!name) return null;

//   return `${base}/api/payment/webhook/${name}`;
// }

// export function hasWebhookUrl(gatewayDoc) {
//   return Boolean(resolveWebhookUrl(gatewayDoc));
// }

// export function assertGatewayActive(gatewayDoc, platform = "website") {
//   if (!gatewayDoc) throw new Error("Payment gateway not configured");
//   if (gatewayDoc.status !== GATEWAY_STATUS.ACTIVE) {
//     throw new Error(`Gateway "${gatewayDoc.displayName}" is ${gatewayDoc.status}`);
//   }
//   if (
//     platform &&
//     gatewayDoc.supportedPlatforms?.length &&
//     !gatewayDoc.supportedPlatforms.includes(platform)
//   ) {
//     throw new Error(`Gateway does not support platform: ${platform}`);
//   }
//   resolveCredentials(gatewayDoc);
// }

// export function normalizePlatform(platform) {
//   const p = String(platform || "website").toLowerCase();
//   return ["website", "android", "ios"].includes(p) ? p : "website";
// }

// export function resolveApiBase(platform, apiPublicUrl) {
//   if (apiPublicUrl) return String(apiPublicUrl).replace(/\/$/, "");
//   if (platform === "website") return String(appConfig.apiPublicUrl || "").replace(/\/$/, "");
//   return String(appConfig.apiPublicUrl || "").replace(/\/$/, "");
// }

// // ── Hosted checkout page helpers ──────────────────────────────────────────────
// export const escapeHtml = (value = "") =>
//   String(value)
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#39;");

// export const CLIENT_HELPERS = `
// function redirectWithParams(baseUrl, params) {
//   if (!baseUrl) return false;
//   var joiner = baseUrl.indexOf("?") > -1 ? "&" : "?";
//   window.location.href = baseUrl + joiner + params.toString();
//   return true;
// }
// function fail(message) { console.error(message); document.body.textContent = message; }
// function loadScript(src, onload, onerror) {
//   var s = document.createElement("script"); s.src = src; s.async = true;
//   s.onload = onload; s.onerror = onerror || function(){ fail("Failed to load payment gateway."); };
//   document.head.appendChild(s);
// }`;

// export function appendQuery(baseUrl, params) {
//   const joiner = baseUrl.includes("?") ? "&" : "?";
//   return `${baseUrl}${joiner}${params.toString()}`;
// }

// export function buildReturnUrl(baseUrl, fields = {}) {
//   if (!baseUrl) return "";
//   const params = new URLSearchParams({ status: fields.status || "processing" });
//   Object.entries(fields).forEach(([k, v]) => {
//     if (v != null && v !== "" && k !== "status") params.set(k, String(v));
//   });
//   return appendQuery(baseUrl, params);
// }

// /** Safely append status query params to a URL that may already contain ?. */
// export function appendStatusParams(baseUrl, fields = {}) {
//   return buildReturnUrl(baseUrl, fields);
// }

// export function isAppPlatform(platform) {
//   return ["android", "ios"].includes(String(platform || "").toLowerCase());
// }

// export function shouldUseServerRedirect(platform, apiBaseUrl) {
//   const p = String(platform || "").toLowerCase();
//   if (["android", "ios"].includes(p)) return true;
//   return String(apiBaseUrl || "").startsWith("https:");
// }

// export function setPageHeaders(res, extraCsp = []) {
//   const csp = [
//     "default-src 'self'",
//     "style-src 'self' 'unsafe-inline'",
//     "img-src 'self' data: blob: https:",
//     "form-action 'self' https:",
//     ...extraCsp,
//   ].join("; ");
//   res.setHeader("Content-Security-Policy", csp);
//   res.setHeader("Content-Type", "text/html; charset=utf-8");
// }

// export function redirectHtml(targetUrl) {
//   const safe = escapeHtml(targetUrl);
//   return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=${safe}"/></head><body><script>location.replace("${safe}");</script></body></html>`;
// }

// /** Customer-safe payment messages — never expose DB / stack details. */
// export const CUSTOMER_PAYMENT_MESSAGE = Object.freeze({
//   generic: "Payment could not be completed. Please try again.",
//   unavailable: "Payment is temporarily unavailable. Please try again later.",
//   cancelled: "Payment was cancelled.",
//   sessionExpired: "Payment session expired. Please start checkout again.",
// });

// const INTERNAL_ERROR_PATTERNS = [
//   /validation failed/i,
//   /enum value/i,
//   /mongoose/i,
//   /mongodb/i,
//   /E11000/i,
//   /startTransaction/i,
//   /Cannot read propert/i,
// ];

// export function customerSafePaymentError(
//   error,
//   fallback = CUSTOMER_PAYMENT_MESSAGE.generic
// ) {
//   const msg = String(error?.message || "").trim();
//   if (!msg) return fallback;
//   if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(msg))) return fallback;
//   return msg;
// }

// export function buildAutoSubmitFormHtml({ action, fields, title = "Payment" }) {
//   const inputs = Object.entries(fields)
//     .map(([n, v]) => `<input type="hidden" name="${escapeHtml(n)}" value="${escapeHtml(v)}"/>`)
//     .join("");
//   return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head><body><form id="f" method="post" action="${escapeHtml(action)}">${inputs}</form><script>document.getElementById("f").submit();</script></body></html>`;
// }

// /** Express middleware — raw body for webhook signatures */
// export function webhookRawBody(req, res, next) {
//   const chunks = [];
//   req.on("data", (c) => chunks.push(c));
//   req.on("end", () => {
//     req.rawBody = Buffer.concat(chunks).toString("utf8");
//     try { req.body = req.rawBody ? JSON.parse(req.rawBody) : {}; } catch { req.body = {}; }
//     next();
//   });
//   req.on("error", next);
// }

/**
 * Payment module configuration — credentials, status mapping, checkout page helpers.
 * Single config file; no separate mapper/credentials/helper modules.
 */

import { config as appConfig } from "../config/config.js";
import {
  GATEWAY_MODE,
  GATEWAY_STATUS,
} from "../models/PaymentGateway.model.js";
import { PAYMENT_STATUS } from "../constants/enums.js";

// ── Retry schedule (server-side verification when webhook is delayed) ─────────
export const VERIFY_RETRY_MS = [30_000, 120_000, 300_000, 900_000, 1_800_000, 3_600_000];
export const MAX_VERIFY_ATTEMPTS = VERIFY_RETRY_MS.length;

// IMPORTANT: SESSION_TTL_MS must outlive the full retry chain above, or
// PaymentCheckoutSession documents get deleted (TTL index on expiresAt)
// mid-retry. runScheduledVerifications() and verifyPayment() both resolve
// customerId from the session record; once it's gone, verifyPayment throws
// "Customer context missing" for every later retry attempt on a payment
// whose webhook was delayed — this was previously happening because the
// retry chain sums to ~112 minutes (30s+120s+300s+900s+1800s+3600s) while
// SESSION_TTL_MS was fixed at 30 minutes. Deriving it from the retry
// schedule keeps the two in sync automatically if the schedule ever changes.
const VERIFY_WINDOW_MS = VERIFY_RETRY_MS.reduce((sum, ms) => sum + ms, 0);
const SESSION_TTL_BUFFER_MS = 15 * 60 * 1000; // headroom for clock drift / slow retries
export const SESSION_TTL_MS = VERIFY_WINDOW_MS + SESSION_TTL_BUFFER_MS; // ~127 min

// NOTE: this only fixes the *retry-worker* lookup. The customer-facing
// checkout page (getCheckoutPage) and browser return flow (handleReturn)
// should keep using a short, separate "is this still a live checkout"
// window (e.g. 30 min) so a customer can't resume paying into a stale
// session hours later — that's a UX/query-level concern, not a storage TTL,
// and should not delete the underlying document.
export const CHECKOUT_PAGE_VALID_MS = 30 * 60 * 1000;

// ── Gateway status → internal status ─────────────────────────────────────────
const STATUS_MAP = {
  razorpay: { captured: PAYMENT_STATUS.SUCCESS, failed: PAYMENT_STATUS.FAILED, refunded: PAYMENT_STATUS.REFUNDED },
  cashfree: { paid: PAYMENT_STATUS.SUCCESS, success: PAYMENT_STATUS.SUCCESS, failed: PAYMENT_STATUS.FAILED },
  phonepe: { completed: PAYMENT_STATUS.SUCCESS, failed: PAYMENT_STATUS.FAILED },
  payu: { success: PAYMENT_STATUS.SUCCESS, failure: PAYMENT_STATUS.FAILED },
  easebuzz: { success: PAYMENT_STATUS.SUCCESS, failure: PAYMENT_STATUS.FAILED },
  paytm: { txn_success: PAYMENT_STATUS.SUCCESS, txn_failure: PAYMENT_STATUS.FAILED },
  stripe: { paid: PAYMENT_STATUS.SUCCESS, unpaid: PAYMENT_STATUS.PENDING },
};

export function mapStatus(gatewayName, raw) {
  const key = String(raw || "").toLowerCase();
  const mapped = STATUS_MAP[String(gatewayName).toLowerCase()]?.[key];
  if (mapped) return mapped;
  if (Object.values(PAYMENT_STATUS).includes(String(raw).toUpperCase())) {
    return String(raw).toUpperCase();
  }
  return PAYMENT_STATUS.PENDING;
}

export function isPaidStatus(status) {
  return status === PAYMENT_STATUS.SUCCESS || status === PAYMENT_STATUS.COMPLETED;
}

const PAYMENT_METHOD_TYPES = ["card", "upi", "netbanking", "wallet", "emi", "cod"];

const GATEWAY_METHOD_MAP = {
  cashfree: {
    upi: "upi",
    card: "card",
    debit_card: "card",
    credit_card: "card",
    prepaid_card: "card",
    net_banking: "netbanking",
    nb: "netbanking",
    wallet: "wallet",
    app: "wallet",
    paylater: "wallet",
    emi: "emi",
    card_emi: "emi",
    cardless_emi: "emi",
    banktransfer: "netbanking",
  },
  razorpay: {
    card: "card",
    upi: "upi",
    netbanking: "netbanking",
    wallet: "wallet",
    emi: "emi",
  },
  phonepe: {
    pay_page: "upi",
    upi: "upi",
    card: "card",
  },
};

/** Map gateway-specific payment method to Payment.paymentMethodType enum. */
export function normalizePaymentMethodType(raw, gatewayName = "") {
  if (raw == null || raw === "" || raw === "unknown") return undefined;

  let value = raw;
  if (typeof value === "object") {
    value = value.payment_group || Object.keys(value)[0];
  }

  const key = String(value).toLowerCase().replace(/[\s-]/g, "_");
  if (PAYMENT_METHOD_TYPES.includes(key)) return key;

  const mapped = GATEWAY_METHOD_MAP[String(gatewayName).toLowerCase()]?.[key];
  if (mapped) return mapped;

  if (key.includes("card")) return "card";
  if (key.includes("upi")) return "upi";
  if (key.includes("net") || key === "nb") return "netbanking";
  if (key.includes("wallet") || key.includes("paytm") || key.includes("phonepe")) return "wallet";
  if (key.includes("emi")) return "emi";

  return undefined;
}

// ── Credentials from DB env names → process.env ───────────────────────────────
export function resolveCredentials(gatewayDoc) {
  if (!gatewayDoc) throw new Error("Payment gateway not configured");

  const isProd =
    gatewayDoc.mode === GATEWAY_MODE.PRODUCTION ||
    appConfig.nodeEnv === "production";

  const keyIdEnv = isProd ? gatewayDoc.productionKeyIdEnv : gatewayDoc.developmentKeyIdEnv;
  const secretEnv = isProd ? gatewayDoc.productionSecretEnv : gatewayDoc.developmentSecretEnv;
  const merchantIdEnv = isProd ? gatewayDoc.productionMerchantIdEnv : gatewayDoc.developmentMerchantIdEnv;

  if (!keyIdEnv || !secretEnv) {
    throw new Error(`Gateway "${gatewayDoc.gatewayName}" missing credential env config`);
  }

  const keyId = process.env[keyIdEnv];
  const secret = process.env[secretEnv];
  if (!keyId || !secret) {
    throw new Error(`Missing .env values: ${keyIdEnv}, ${secretEnv}`);
  }

  return {
    keyId,
    secret,
    merchantId: merchantIdEnv ? process.env[merchantIdEnv] : undefined,
    webhookSecret: gatewayDoc.webhookSecretEnv
      ? process.env[gatewayDoc.webhookSecretEnv]
      : undefined,
    webhookUrl: resolveWebhookUrl(gatewayDoc),
    mode: isProd ? GATEWAY_MODE.PRODUCTION : GATEWAY_MODE.DEVELOPMENT,
  };
}

/**
 * Webhook URL priority:
 * 1. Custom URL saved on gateway (admin panel)
 * 2. Full URL from .env via webhookUrlEnv
 * 3. PAYMENT_WEBHOOK_BASE_URL (or API_PUBLIC_URL) + /api/payment/webhook/:gateway
 * 4. null — payments still work via server-side verification
 */
export function resolveWebhookUrl(gatewayDoc) {
  if (!gatewayDoc) return null;

  const custom = String(gatewayDoc.webhookUrl || "").trim();
  if (custom) return custom.replace(/\/$/, "");

  const envName = String(gatewayDoc.webhookUrlEnv || "").trim();
  if (envName && process.env[envName]) {
    return String(process.env[envName]).trim().replace(/\/$/, "");
  }

  const base = String(appConfig.paymentWebhookBaseUrl || "").trim().replace(/\/$/, "");
  if (!base) return null;

  const name = String(gatewayDoc.gatewayName || "").trim().toLowerCase();
  if (!name) return null;

  return `${base}/api/payment/webhook/${name}`;
}

export function hasWebhookUrl(gatewayDoc) {
  return Boolean(resolveWebhookUrl(gatewayDoc));
}

export function assertGatewayActive(gatewayDoc, platform = "website") {
  if (!gatewayDoc) throw new Error("Payment gateway not configured");
  if (gatewayDoc.status !== GATEWAY_STATUS.ACTIVE) {
    throw new Error(`Gateway "${gatewayDoc.displayName}" is ${gatewayDoc.status}`);
  }
  if (
    platform &&
    gatewayDoc.supportedPlatforms?.length &&
    !gatewayDoc.supportedPlatforms.includes(platform)
  ) {
    throw new Error(`Gateway does not support platform: ${platform}`);
  }
  resolveCredentials(gatewayDoc);
}

export function normalizePlatform(platform) {
  const p = String(platform || "website").toLowerCase();
  return ["website", "android", "ios"].includes(p) ? p : "website";
}

export function resolveApiBase(platform, apiPublicUrl) {
  if (apiPublicUrl) return String(apiPublicUrl).replace(/\/$/, "");
  if (platform === "website") return String(appConfig.apiPublicUrl || "").replace(/\/$/, "");
  return String(appConfig.apiPublicUrl || "").replace(/\/$/, "");
}

// ── Hosted checkout page helpers ──────────────────────────────────────────────
export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const CLIENT_HELPERS = `
function redirectWithParams(baseUrl, params) {
  if (!baseUrl) return false;
  var joiner = baseUrl.indexOf("?") > -1 ? "&" : "?";
  window.location.href = baseUrl + joiner + params.toString();
  return true;
}
function fail(message) { console.error(message); document.body.textContent = message; }
function loadScript(src, onload, onerror) {
  var s = document.createElement("script"); s.src = src; s.async = true;
  s.onload = onload; s.onerror = onerror || function(){ fail("Failed to load payment gateway."); };
  document.head.appendChild(s);
}`;

export function appendQuery(baseUrl, params) {
  const joiner = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${joiner}${params.toString()}`;
}

export function buildReturnUrl(baseUrl, fields = {}) {
  if (!baseUrl) return "";
  const params = new URLSearchParams({ status: fields.status || "processing" });
  Object.entries(fields).forEach(([k, v]) => {
    if (v != null && v !== "" && k !== "status") params.set(k, String(v));
  });
  return appendQuery(baseUrl, params);
}

/** Safely append status query params to a URL that may already contain ?. */
export function appendStatusParams(baseUrl, fields = {}) {
  return buildReturnUrl(baseUrl, fields);
}

export function isAppPlatform(platform) {
  return ["android", "ios"].includes(String(platform || "").toLowerCase());
}

export function shouldUseServerRedirect(platform, apiBaseUrl) {
  const p = String(platform || "").toLowerCase();
  if (["android", "ios"].includes(p)) return true;
  return String(apiBaseUrl || "").startsWith("https:");
}

export function setPageHeaders(res, extraCsp = []) {
  const csp = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "form-action 'self' https:",
    ...extraCsp,
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
}

export function redirectHtml(targetUrl) {
  const safe = escapeHtml(targetUrl);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="refresh" content="0;url=${safe}"/></head><body><script>location.replace("${safe}");</script></body></html>`;
}

/** Customer-safe payment messages — never expose DB / stack details. */
export const CUSTOMER_PAYMENT_MESSAGE = Object.freeze({
  generic: "Payment could not be completed. Please try again.",
  unavailable: "Payment is temporarily unavailable. Please try again later.",
  cancelled: "Payment was cancelled.",
  sessionExpired: "Payment session expired. Please start checkout again.",
});

const INTERNAL_ERROR_PATTERNS = [
  /validation failed/i,
  /enum value/i,
  /mongoose/i,
  /mongodb/i,
  /E11000/i,
  /startTransaction/i,
  /Cannot read propert/i,
];

export function customerSafePaymentError(
  error,
  fallback = CUSTOMER_PAYMENT_MESSAGE.generic
) {
  const msg = String(error?.message || "").trim();
  if (!msg) return fallback;
  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(msg))) return fallback;
  return msg;
}

export function buildAutoSubmitFormHtml({ action, fields, title = "Payment" }) {
  const inputs = Object.entries(fields)
    .map(([n, v]) => `<input type="hidden" name="${escapeHtml(n)}" value="${escapeHtml(v)}"/>`)
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title></head><body><form id="f" method="post" action="${escapeHtml(action)}">${inputs}</form><script>document.getElementById("f").submit();</script></body></html>`;
}

/** Express middleware — raw body for webhook signatures */
export function webhookRawBody(req, res, next) {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks).toString("utf8");
    try { req.body = req.rawBody ? JSON.parse(req.rawBody) : {}; } catch { req.body = {}; }
    next();
  });
  req.on("error", next);
}