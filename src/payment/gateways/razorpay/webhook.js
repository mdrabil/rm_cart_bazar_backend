import crypto from "crypto";
import { mapStatus } from "../../config.js";

export function verifySignature(req, credentials) {
  const signature = req.headers["x-razorpay-signature"];
  if (!credentials.webhookSecret || !signature) {
    return { valid: false, eventId: null };
  }
  const raw =
    req.rawBody ||
    (Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body));
  const expected = crypto
    .createHmac("sha256", credentials.webhookSecret)
    .update(raw)
    .digest("hex");
  return {
    valid: expected === signature,
    eventId: req.body?.payload?.payment?.entity?.id,
  };
}

export function parseEvent(event) {
  const entity =
    event?.payload?.payment?.entity ||
    event?.payload?.order?.entity ||
    event?.payload?.refund?.entity;
  const rawStatus = entity?.status;
  return {
    gatewayOrderId: entity?.order_id,
    transactionId: entity?.id,
    amount: entity?.amount ? Number(entity.amount) / 100 : undefined,
    status: mapStatus("razorpay", rawStatus),
    raw: event,
  };
}
