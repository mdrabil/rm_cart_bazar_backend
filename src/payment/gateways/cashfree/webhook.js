import crypto from "crypto";
import { mapStatus } from "../../config.js";

export function verifySignature(req, credentials) {
  const signature = req.headers["x-webhook-signature"];
  const timestamp = req.headers["x-webhook-timestamp"];
  if (!credentials.webhookSecret || !signature || !timestamp) {
    return { valid: false, eventId: null };
  }
  const raw =
    req.rawBody ||
    (Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body));
  const expected = crypto
    .createHmac("sha256", credentials.webhookSecret)
    .update(`${timestamp}${raw}`)
    .digest("base64");
  return {
    valid: expected === signature,
    eventId: req.body?.data?.payment?.cf_payment_id,
  };
}

export function parseEvent(event) {
  const payment = event?.data?.payment || {};
  const order = event?.data?.order || {};
  const raw = payment.payment_status || order.order_status;
  return {
    gatewayOrderId: order.order_id || payment.order_id,
    transactionId: payment.cf_payment_id || payment.payment_id,
    amount: Number(payment.payment_amount || order.order_amount || 0),
    status: mapStatus("cashfree", raw),
    raw: event,
  };
}
