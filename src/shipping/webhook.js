/**
 * Universal shipping webhook dispatcher.
 */

import ShippingGateway from "../models/ShippingGateway.model.js";
import Shipment from "../models/Shipment.model.js";
import ShippingFactory from "./factory.js";

export async function handleShippingWebhook(providerName, req) {
  const gatewayDoc = await ShippingGateway.findOne({
    providerName: { $regex: `^${providerName}$`, $options: "i" },
  });

  if (!gatewayDoc) {
    console.warn(`[Shipping][Webhook] Unknown provider: ${providerName}`);
    return { skipped: true, reason: "Provider not configured" };
  }

  if (!gatewayDoc.webhookEnabled) {
    console.log(`[Shipping][Webhook] Webhooks disabled for ${providerName}`);
    return { skipped: true, reason: "Webhooks disabled" };
  }

  const provider = ShippingFactory.load(gatewayDoc);
  const webhookModule = provider.service.webhook;

  if (!webhookModule) {
    console.log(`[Shipping][Webhook] Provider ${providerName} does not support webhooks`);
    return { skipped: true, reason: "Webhooks not supported" };
  }

  const signature =
    req.headers["x-shiprocket-signature"] ||
    req.headers["x-webhook-signature"] ||
    req.headers["x-delhivery-signature"] ||
    req.headers["x-signature"];

  if (webhookModule.verifySignature) {
    const valid = webhookModule.verifySignature({
      rawBody: req.rawBody,
      signature,
      secret: provider.credentials.webhookSecret,
    });
    if (!valid) {
      throw new Error("Invalid webhook signature");
    }
  }

  const event = webhookModule.parseEvent(req.body || {});
  if (!event?.awb && !event?.providerShipmentId) {
    return { skipped: true, reason: "No shipment reference in webhook" };
  }

  const query = event.awb
    ? { awb: event.awb }
    : { providerShipmentId: event.providerShipmentId };

  const shipment = await Shipment.findOne(query);
  if (!shipment) {
    console.warn(`[Shipping][Webhook] Shipment not found for`, query);
    return { skipped: true, reason: "Shipment not found" };
  }

  if (event.status) shipment.status = event.status;
  if (event.message) {
    shipment.trackingHistory.push({
      status: event.status,
      message: event.message,
      timestamp: new Date(),
      raw: event.raw,
    });
  }
  shipment.lastTrackedAt = new Date();
  await shipment.save();

  return { success: true, shipmentId: shipment._id, status: shipment.status };
}
