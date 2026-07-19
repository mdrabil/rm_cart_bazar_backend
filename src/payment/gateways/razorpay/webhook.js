// import crypto from "crypto";
// import { mapStatus } from "../../config.js";

// export function verifySignature(req, credentials) {
//   const signature = req.headers["x-razorpay-signature"];
//   if (!credentials.webhookSecret || !signature) {
//     return { valid: false, eventId: null };
//   }
//   const raw =
//     req.rawBody ||
//     (Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body));
//   const expected = crypto
//     .createHmac("sha256", credentials.webhookSecret)
//     .update(raw)
//     .digest("hex");
//   return {
//     valid: expected === signature,
//     eventId: req.body?.payload?.payment?.entity?.id,
//   };
// }

// export function parseEvent(event) {
//   const entity =
//     event?.payload?.payment?.entity ||
//     event?.payload?.order?.entity ||
//     event?.payload?.refund?.entity;
//   const rawStatus = entity?.status;
//   return {
//     gatewayOrderId: entity?.order_id,
//     transactionId: entity?.id,
//     amount: entity?.amount ? Number(entity.amount) / 100 : undefined,
//     status: mapStatus("razorpay", rawStatus),
//     raw: event,
//   };
// }


import crypto from "crypto";
import { mapStatus } from "../../config.js";

export function verifySignature(req, credentials) {
  const signature = req.headers["x-razorpay-signature"];
  if (!credentials.webhookSecret) {
    console.error("[Razorpay][Webhook] no webhookSecret configured for this gateway — rejecting");
    return { valid: false, eventId: null };
  }
  if (!signature) {
    console.warn("[Razorpay][Webhook] request missing x-razorpay-signature header — rejecting");
    return { valid: false, eventId: null };
  }
  // NOTE: this requires req.rawBody to be the exact raw request bytes captured
  // *before* JSON parsing (e.g. via express.json({ verify: (req, res, buf) =>
  // { req.rawBody = buf; } }) on this route). If the app's body parser doesn't
  // capture rawBody, this falls back to JSON.stringify(req.body), which will
  // NOT match Razorpay's signature (key order/whitespace differ) and every
  // webhook will silently fail verification — check this if webhooks never
  // seem to fire even though Razorpay's dashboard shows them as delivered.
  if (!req.rawBody) {
    console.warn("[Razorpay][Webhook] req.rawBody missing — falling back to JSON.stringify, signature check may fail");
  }
  const raw =
    req.rawBody ||
    (Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body));
  const expected = crypto
    .createHmac("sha256", credentials.webhookSecret)
    .update(raw)
    .digest("hex");
  const valid = expected === signature;
  const eventId = req.body?.payload?.payment?.entity?.id;
  if (!valid) {
    console.warn(`[Razorpay][Webhook] signature mismatch eventId=${eventId}`);
  } else {
    console.log(`[Razorpay][Webhook] signature verified eventId=${eventId}`);
  }
  return { valid, eventId };
}

export function parseEvent(event) {
  const entity =
    event?.payload?.payment?.entity ||
    event?.payload?.order?.entity ||
    event?.payload?.refund?.entity;
  const rawStatus = entity?.status;
  const parsed = {
    gatewayOrderId: entity?.order_id,
    transactionId: entity?.id,
    amount: entity?.amount ? Number(entity.amount) / 100 : undefined,
    status: mapStatus("razorpay", rawStatus),
    raw: event,
  };
  console.log(
    `[Razorpay][Webhook] parsed event=${event?.event} orderId=${parsed.gatewayOrderId} ` +
      `paymentId=${parsed.transactionId} status=${parsed.status}`
  );
  return parsed;
}