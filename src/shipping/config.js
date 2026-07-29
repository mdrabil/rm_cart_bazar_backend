/**
 * Shipping module configuration — credentials, status mapping, helpers.
 */

import { config as appConfig } from "../config/config.js";
import {
  PROVIDER_MODE,
  PROVIDER_STATUS,
} from "../models/ShippingGateway.model.js";
import { SHIPMENT_STATUS } from "../models/Shipment.model.js";

export const REQUEST_TIMEOUT_MS = 30_000;

const STATUS_MAP = {
  shiprocket: {
    booked: SHIPMENT_STATUS.BOOKED,
    pending: SHIPMENT_STATUS.PENDING,
    pickup_scheduled: SHIPMENT_STATUS.BOOKED,
    picked_up: SHIPMENT_STATUS.PICKED_UP,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
    failed: SHIPMENT_STATUS.FAILED,
  },
  delhivery: {
    booked: SHIPMENT_STATUS.BOOKED,
    manifest: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    dispatched: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
    pending: SHIPMENT_STATUS.PENDING,
  },
  bluedart: {
    booked: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
  },
  dtdc: {
    booked: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
  },
  xpressbees: {
    booked: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
  },
  ekart: {
    booked: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
    pending: SHIPMENT_STATUS.PENDING,
  },
  shadowfax: {
    booked: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
  },
  pickrr: {
    booked: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
  },
  fedex: {
    booked: SHIPMENT_STATUS.BOOKED,
    in_transit: SHIPMENT_STATUS.IN_TRANSIT,
    out_for_delivery: SHIPMENT_STATUS.OUT_FOR_DELIVERY,
    delivered: SHIPMENT_STATUS.DELIVERED,
    cancelled: SHIPMENT_STATUS.CANCELLED,
    rto: SHIPMENT_STATUS.RTO,
  },
};

const TRACKING_URL_BUILDERS = {
  shiprocket: (awb) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`,
  delhivery: (awb) => `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`,
  bluedart: (awb) =>
    `https://www.bluedart.com/web/guest/trackdartresultthirdparty?trackFor=0&trackNo=${encodeURIComponent(awb)}`,
  dtdc: (awb) => `https://www.dtdc.in/tracking.asp?strCnno=${encodeURIComponent(awb)}`,
  xpressbees: (awb) => `https://www.xpressbees.com/shipment/tracking?awbNo=${encodeURIComponent(awb)}`,
  ekart: (awb) => `https://ekartlogistics.com/ekartlogistics-web/tracking?tracking_id=${encodeURIComponent(awb)}`,
  shadowfax: (awb) => `https://tracker.shadowfax.in/#/tracking/${encodeURIComponent(awb)}`,
  pickrr: (awb) => `https://www.pickrr.com/tracking/#/?tracking_id=${encodeURIComponent(awb)}`,
  fedex: (awb) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(awb)}`,
};

export function buildTrackingUrl(providerName, awb) {
  if (!awb) return null;
  const key = String(providerName || "").trim().toLowerCase();
  const builder = TRACKING_URL_BUILDERS[key];
  return builder ? builder(String(awb).trim()) : null;
}

export function providerKey(name) {
  return String(name || "").trim().toLowerCase();
}

export function mapStatus(providerName, raw) {
  const key = String(raw || "").toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = STATUS_MAP[String(providerName).toLowerCase()]?.[key];
  if (mapped) return mapped;
  const upper = String(raw || "").toUpperCase();
  if (Object.values(SHIPMENT_STATUS).includes(upper)) return upper;
  return SHIPMENT_STATUS.PENDING;
}

export function resolveCredentials(gatewayDoc) {
  if (!gatewayDoc) throw new Error("Shipping provider not configured");

  const isProd =
    gatewayDoc.mode === PROVIDER_MODE.PRODUCTION ||
    appConfig.nodeEnv === "production";

  const keyIdEnv = isProd ? gatewayDoc.productionKeyIdEnv : gatewayDoc.developmentKeyIdEnv;
  const secretEnv = isProd ? gatewayDoc.productionSecretEnv : gatewayDoc.developmentSecretEnv;
  const merchantIdEnv = isProd ? gatewayDoc.productionMerchantIdEnv : gatewayDoc.developmentMerchantIdEnv;

  if (!keyIdEnv || !secretEnv) {
    throw new Error(`Provider "${gatewayDoc.providerName}" missing credential env config`);
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
    mode: isProd ? PROVIDER_MODE.PRODUCTION : PROVIDER_MODE.DEVELOPMENT,
  };
}

export function resolveWebhookUrl(gatewayDoc) {
  if (!gatewayDoc) return null;

  const custom = String(gatewayDoc.webhookUrl || "").trim();
  if (custom) return custom.replace(/\/$/, "");

  const envName = String(gatewayDoc.webhookUrlEnv || "").trim();
  if (envName && process.env[envName]) {
    return String(process.env[envName]).trim().replace(/\/$/, "");
  }

  const base = String(
    process.env.SHIPPING_WEBHOOK_BASE_URL || appConfig.apiPublicUrl || ""
  )
    .trim()
    .replace(/\/$/, "");

  if (!base) return null;

  const name = String(gatewayDoc.providerName || "").trim().toLowerCase();
  if (!name) return null;

  return `${base}/api/shipping/webhook/${name}`;
}

export function assertProviderActive(gatewayDoc) {
  if (!gatewayDoc) throw new Error("Shipping provider not configured");
  if (gatewayDoc.status !== PROVIDER_STATUS.ACTIVE) {
    throw new Error(`Provider "${gatewayDoc.displayName}" is ${gatewayDoc.status}`);
  }
  resolveCredentials(gatewayDoc);
}

export async function httpRequest(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        data?.errors?.[0]?.message ||
        `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.response = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Shipping provider request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function safeProviderError(error, fallback = "Shipment operation failed") {
  const msg = String(error?.message || "").trim();
  if (!msg) return fallback;
  if (/mongoose|mongodb|E11000|validation failed/i.test(msg)) return fallback;
  return msg;
}

export function webhookRawBody(req, res, next) {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks).toString("utf8");
    try {
      req.body = req.rawBody ? JSON.parse(req.rawBody) : {};
    } catch {
      req.body = {};
    }
    next();
  });
  req.on("error", next);
}
