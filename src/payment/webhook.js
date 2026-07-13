/**
 * Universal webhook handler.
 * POST /api/payment/webhook/:gateway
 */

import PaymentWebhookLog from "../models/PaymentWebhookLog.model.js";
import { loadGateway, getGatewayDocByName } from "./factory.js";
import { assertGatewayActive, isPaidStatus } from "./config.js";

let verifyPayment;

export function bindVerify(fn) {
  verifyPayment = fn;
}

function idempotencyKey(gateway, eventType, eventId) {
  return [gateway, eventType, eventId].filter(Boolean).join(":");
}

export async function handleWebhook(gatewayName, req) {
  if (!verifyPayment) throw new Error("Payment module not initialized");

  const doc = await getGatewayDocByName(gatewayName);
  if (!doc.webhookEnabled) {
    return { success: true, skipped: true, reason: "webhooks_disabled" };
  }
  assertGatewayActive(doc);

  const { credentials, service } = loadGateway(doc);
  const wh = service.webhook;
  if (!wh?.verifySignature) {
    return { success: true, skipped: true, reason: "webhook_not_supported" };
  }

  // Missing webhook secret — cannot verify; rely on server-side verification instead.
  if (!credentials.webhookSecret) {
    return { success: true, skipped: true, reason: "webhook_secret_not_configured" };
  }

  const verification = wh.verifySignature(req, credentials);
  const event = req.body;
  const key = idempotencyKey(
    gatewayName,
    event?.event || event?.type,
    verification.eventId
  );

  const existing = await PaymentWebhookLog.findOne({ idempotencyKey: key });
  if (existing?.processed) return { success: true, duplicate: true };

  const log = await PaymentWebhookLog.create({
    gatewayName,
    eventType: event?.event || event?.type || "unknown",
    eventId: verification.eventId,
    payload: event,
    signatureValid: verification.valid,
    idempotencyKey: key,
  });

  if (!verification.valid) {
    log.processingError = "Invalid webhook signature";
    await log.save();
    throw new Error("Invalid webhook signature");
  }

  const parsed = wh.parseEvent(event);
  let result = null;

  if (parsed.gatewayOrderId && isPaidStatus(parsed.status)) {
    result = await verifyPayment({
      source: "webhook",
      gatewayName: doc.gatewayName,
      gatewayOrderId: parsed.gatewayOrderId,
      transactionId: parsed.transactionId,
    });
  }

  log.processed = true;
  log.fulfillmentResult = result;
  await log.save();

  return { success: true, parsed, result };
}
