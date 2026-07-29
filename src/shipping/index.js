/**
 * Shipping core — create shipment, track, webhook handling.
 */

import Order from "../models/Order.model.js";
import Shipment, { SHIPMENT_STATUS } from "../models/Shipment.model.js";
import ShippingFactory from "./factory.js";
import { safeProviderError } from "./config.js";
import { generateMRId } from "../utils/mrId.js";
import { handleShippingWebhook } from "./webhook.js";
import { resolvePickup, resolveDelivery } from "./addressResolve.js";

function applyStatusTimeline(shipment, status) {
  const now = new Date();
  if (status === SHIPMENT_STATUS.BOOKED && !shipment.statusTimeline.bookedAt) {
    shipment.statusTimeline.bookedAt = now;
  }
  if (status === SHIPMENT_STATUS.PICKED_UP && !shipment.statusTimeline.pickedUpAt) {
    shipment.statusTimeline.pickedUpAt = now;
  }
  if (status === SHIPMENT_STATUS.IN_TRANSIT && !shipment.statusTimeline.inTransitAt) {
    shipment.statusTimeline.inTransitAt = now;
  }
  if (status === SHIPMENT_STATUS.OUT_FOR_DELIVERY && !shipment.statusTimeline.outForDeliveryAt) {
    shipment.statusTimeline.outForDeliveryAt = now;
  }
  if (status === SHIPMENT_STATUS.DELIVERED && !shipment.statusTimeline.deliveredAt) {
    shipment.statusTimeline.deliveredAt = now;
  }
  if (status === SHIPMENT_STATUS.CANCELLED && !shipment.statusTimeline.cancelledAt) {
    shipment.statusTimeline.cancelledAt = now;
  }
  if (status === SHIPMENT_STATUS.FAILED && !shipment.statusTimeline.failedAt) {
    shipment.statusTimeline.failedAt = now;
  }
}

async function tryOptional(method, ...args) {
  if (typeof method !== "function") {
    return { skipped: true, reason: "Feature not supported by provider" };
  }
  try {
    return await method(...args);
  } catch (error) {
    console.warn("[Shipping] Optional feature failed:", error.message);
    return { skipped: true, error: error.message };
  }
}

export async function createShipment({
  orderId,
  providerName,
  payload,
  userId,
}) {
  const order = await Order.findById(orderId).populate("customerId", "fullName email mobile");
  if (!order) throw new Error("Order not found");

  if (order.shipmentId) {
    const existing = await Shipment.findById(order.shipmentId);
    if (existing && existing.status !== SHIPMENT_STATUS.CANCELLED && existing.status !== SHIPMENT_STATUS.FAILED) {
      throw new Error("Order already has an active shipment");
    }
  }

  const provider = providerName
    ? await ShippingFactory.get(providerName)
    : await ShippingFactory.getActive();

  const pickupResolved = await resolvePickup(order, payload.pickupLocation || {});
  const deliveryResolved = await resolveDelivery(order, {
    receiver: payload.receiver,
    deliveryAddress: payload.deliveryAddress,
  });

  if (!pickupResolved.pickupComplete) {
    throw new Error(
      `Pickup address incomplete. Missing: ${pickupResolved.pickupMissingFields.join(", ")}`
    );
  }
  if (!deliveryResolved.receiverComplete) {
    throw new Error(
      `Receiver incomplete. Missing: ${deliveryResolved.receiverMissingFields.join(", ")}`
    );
  }
  if (!deliveryResolved.deliveryComplete) {
    throw new Error(
      `Delivery address incomplete. Missing: ${deliveryResolved.deliveryMissingFields.join(", ")}`
    );
  }

  const mrShipmentId = await generateMRId("SHP", "SHIPMENT");

  // Snapshot pickup + delivery onto the shipment (immutable historical copy)
  const shipment = await Shipment.create({
    mrShipmentId,
    orderId: order._id,
    providerName: provider.doc.providerName,
    providerGatewayId: provider.doc._id,
    status: SHIPMENT_STATUS.PENDING,
    pickupLocation: pickupResolved.pickup,
    receiver: deliveryResolved.receiver,
    deliveryAddress: deliveryResolved.deliveryAddress,
    weight: payload.weight,
    weightUnit: payload.weightUnit || "kg",
    dimensions: payload.dimensions,
    packageCount: payload.packageCount || 1,
    shippingCharges: payload.shippingCharges || 0,
    codAmount: payload.codAmount ?? (order.paymentMethod === "COD" ? order.payableAmount : 0),
    notes: payload.notes,
    createdBy: userId,
    updatedBy: userId,
  });

  const providerPayload = {
    orderReference: order.mrOrderId,
    pickupLocation: {
      ...pickupResolved.pickup,
      address:
        pickupResolved.pickup.address ||
        pickupResolved.pickup.fullAddress ||
        pickupResolved.pickup.addressLine ||
        "",
    },
    receiver: deliveryResolved.receiver,
    deliveryAddress: deliveryResolved.deliveryAddress,
    weight: shipment.weight,
    dimensions: shipment.dimensions,
    packageCount: shipment.packageCount,
    shippingCharges: shipment.shippingCharges,
    codAmount: shipment.codAmount,
    subTotal: order.payableAmount,
    items: order.items,
    notes: shipment.notes,
  };

  try {
    const result = await provider.service.createShipment(providerPayload);

    if (result.awb) shipment.awb = result.awb;
    if (result.trackingNumber) shipment.trackingNumber = result.trackingNumber;
    if (result.providerShipmentId) shipment.providerShipmentId = result.providerShipmentId;
    if (result.courierName) shipment.courierName = result.courierName;
    if (result.status) {
      shipment.status = result.status;
      applyStatusTimeline(shipment, result.status);
    }
    shipment.providerResponse = result.raw || result;
    shipment.bookingError = undefined;

    if (result.status === SHIPMENT_STATUS.BOOKED) {
      shipment.statusTimeline.bookedAt = new Date();
    }

    if (provider.service.capabilities?.labelDownload && result.providerShipmentId) {
      const label = await tryOptional(provider.service.getLabel?.bind(provider.service), {
        providerShipmentId: result.providerShipmentId,
        awb: result.awb,
      });
      if (label?.labelUrl) shipment.labelUrl = label.labelUrl;
    }

    if (provider.service.capabilities?.manifest && result.providerShipmentId) {
      const manifest = await tryOptional(provider.service.getManifest?.bind(provider.service), {
        providerShipmentId: result.providerShipmentId,
        awb: result.awb,
      });
      if (manifest?.manifestUrl) shipment.manifestUrl = manifest.manifestUrl;
    }

    shipment.updatedBy = userId;
    await shipment.save();

    order.shipmentId = shipment._id;
    await order.save();

    return { success: true, shipment, provider: provider.doc.providerName };
  } catch (error) {
    console.error("[Shipping] createShipment failed:", error.message);
    shipment.status = SHIPMENT_STATUS.FAILED;
    shipment.bookingError = safeProviderError(error);
    shipment.statusTimeline.failedAt = new Date();
    shipment.updatedBy = userId;
    await shipment.save();
    throw new Error(safeProviderError(error, "Failed to create shipment with provider"));
  }
}

export async function refreshTracking(shipmentId) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error("Shipment not found");

  const provider = await ShippingFactory.get(shipment.providerName);

  if (!provider.service.capabilities?.tracking) {
    return { shipment, skipped: true, reason: "Tracking not supported by provider" };
  }

  const result = await tryOptional(provider.service.trackShipment?.bind(provider.service), {
    awb: shipment.awb,
    providerShipmentId: shipment.providerShipmentId,
  });

  if (result?.skipped) return { shipment, ...result };

  if (result.status) {
    shipment.status = result.status;
    applyStatusTimeline(shipment, result.status);
  }
  if (result.trackingHistory?.length) {
    shipment.trackingHistory = result.trackingHistory;
  }
  shipment.lastTrackedAt = new Date();
  shipment.providerResponse = { ...(shipment.providerResponse || {}), lastTrack: result.raw };
  await shipment.save();

  return { shipment, tracking: result };
}

export async function cancelShipmentRecord(shipmentId, userId) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error("Shipment not found");

  const provider = await ShippingFactory.get(shipment.providerName);

  if (provider.service.capabilities?.cancel) {
    await tryOptional(provider.service.cancelShipment?.bind(provider.service), {
      awb: shipment.awb,
      providerShipmentId: shipment.providerShipmentId,
    });
  }

  shipment.status = SHIPMENT_STATUS.CANCELLED;
  shipment.statusTimeline.cancelledAt = new Date();
  shipment.updatedBy = userId;
  await shipment.save();

  return shipment;
}

export async function getPickupLocations(providerName) {
  const provider = await ShippingFactory.get(providerName);
  if (!provider.service.capabilities?.pickupLocations) {
    return { locations: [], skipped: true, reason: "Pickup locations not supported" };
  }
  const result = await tryOptional(
    provider.service.getPickupLocations?.bind(provider.service)
  );
  return { locations: result?.locations || result || [] };
}

export async function listActiveProviders() {
  const ShippingGateway = (await import("../models/ShippingGateway.model.js")).default;
  const { PROVIDER_STATUS } = await import("../models/ShippingGateway.model.js");

  const docs = await ShippingGateway.find({ status: PROVIDER_STATUS.ACTIVE }).sort({
    priority: 1,
    providerName: 1,
  });

  return docs.map((doc) => ({
    providerName: doc.providerName,
    displayName: doc.displayName,
    isDefault: doc.isDefault,
    capabilities: ShippingFactory.getCapabilities(doc.providerName) || {},
  }));
}

export async function fetchShipmentDocument(shipmentId, type) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error("Shipment not found");

  const provider = await ShippingFactory.get(shipment.providerName);
  const caps = provider.service.capabilities || {};
  const args = {
    awb: shipment.awb,
    providerShipmentId: shipment.providerShipmentId,
  };

  if (type === "label") {
    if (!caps.labelDownload) return { skipped: true, reason: "Label download not supported" };
    const result = await tryOptional(provider.service.getLabel?.bind(provider.service), args);
    if (result?.labelUrl) {
      shipment.labelUrl = result.labelUrl;
      await shipment.save();
    }
    return result;
  }

  if (type === "manifest") {
    if (!caps.manifest) return { skipped: true, reason: "Manifest not supported" };
    const result = await tryOptional(provider.service.getManifest?.bind(provider.service), args);
    if (result?.manifestUrl) {
      shipment.manifestUrl = result.manifestUrl;
      await shipment.save();
    }
    return result;
  }

  if (type === "invoice") {
    if (!caps.invoiceDownload) return { skipped: true, reason: "Invoice download not supported" };
    const result = await tryOptional(provider.service.getInvoice?.bind(provider.service), args);
    if (result?.invoiceUrl) {
      shipment.invoiceUrl = result.invoiceUrl;
      await shipment.save();
    }
    return result;
  }

  return { skipped: true, reason: "Unknown document type" };
}

export async function getShipmentDetails(shipmentId) {
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error("Shipment not found");
  return shipment;
}

const Shipping = {
  createShipment,
  refreshTracking,
  cancelShipment: cancelShipmentRecord,
  getPickupLocations,
  listActiveProviders,
  handleWebhook: handleShippingWebhook,
  fetchShipmentDocument,
  getShipmentDetails,
};

export default Shipping;
