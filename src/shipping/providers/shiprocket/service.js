import crypto from "crypto";
import { mapStatus } from "../../config.js";
import { CAPABILITIES } from "./config.js";
import * as api from "./api.js";

function buildOrderPayload(payload) {
  const addr = payload.deliveryAddress || {};
  const receiver = payload.receiver || {};
  const pickup = payload.pickupLocation || {};

  return {
    order_id: payload.orderReference,
    order_date: new Date().toISOString().slice(0, 10),
    pickup_location: pickup.name || pickup.locationId || "Primary",
    billing_customer_name: receiver.name,
    billing_last_name: "",
    billing_address: addr.addressLine || addr.fullAddress,
    billing_city: addr.city,
    billing_pincode: addr.pincode,
    billing_state: addr.state || "",
    billing_country: addr.country || "India",
    billing_email: receiver.email || "",
    billing_phone: receiver.phone,
    shipping_is_billing: true,
    order_items: (payload.items || []).map((item) => ({
      name: item.productName || item.name || "Product",
      sku: item.sku || item.productId || "SKU",
      units: item.qty || 1,
      selling_price: item.sellingPrice || item.price || 0,
    })),
    payment_method: payload.codAmount > 0 ? "COD" : "Prepaid",
    sub_total: payload.subTotal || payload.codAmount || 0,
    length: payload.dimensions?.length || 10,
    breadth: payload.dimensions?.width || 10,
    height: payload.dimensions?.height || 10,
    weight: payload.weight || 0.5,
  };
}

export default function createShiprocketService(credentials, gatewayDoc) {
  const logPrefix = "[Shiprocket]";

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const orderPayload = buildOrderPayload(payload);
      const response = await api.createAdhocOrder(credentials, orderPayload);

      const shipmentId = response?.shipment_id || response?.payload?.shipment_id;
      const awb = response?.awb_code || response?.payload?.awb_code;
      const courier = response?.courier_name || response?.payload?.courier_name;

      return {
        providerShipmentId: shipmentId ? String(shipmentId) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: courier || "Shiprocket",
        status: awb ? mapStatus("shiprocket", "booked") : mapStatus("shiprocket", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      console.log(`${logPrefix} trackShipment awb=${awb}`);
      const response = await api.trackByAwb(credentials, awb);
      const trackData = response?.tracking_data || response;
      const currentStatus =
        trackData?.shipment_status ||
        trackData?.current_status ||
        trackData?.track_status;

      const history = (trackData?.shipment_track || trackData?.track || []).map((entry) => ({
        status: entry.current_status || entry.status,
        message: entry.activity || entry.remark || entry.status,
        location: entry.location || "",
        timestamp: entry.date ? new Date(entry.date) : new Date(),
        raw: entry,
      }));

      return {
        status: mapStatus("shiprocket", currentStatus),
        trackingHistory: history,
        raw: response,
      };
    },

    async cancelShipment({ providerShipmentId }) {
      if (!providerShipmentId) return { skipped: true, reason: "Provider shipment ID missing" };
      console.log(`${logPrefix} cancelShipment id=${providerShipmentId}`);
      const response = await api.cancelOrder(credentials, [Number(providerShipmentId)]);
      return { cancelled: true, raw: response };
    },

    async getLabel({ providerShipmentId }) {
      if (!providerShipmentId) return { skipped: true, reason: "Provider shipment ID missing" };
      const response = await api.generateLabel(credentials, [Number(providerShipmentId)]);
      return {
        labelUrl: response?.label_url || response?.response?.data?.label_url,
        raw: response,
      };
    },

    async getManifest({ providerShipmentId }) {
      if (!providerShipmentId) return { skipped: true, reason: "Provider shipment ID missing" };
      const response = await api.generateManifest(credentials, [Number(providerShipmentId)]);
      return {
        manifestUrl: response?.manifest_url || response?.response?.data?.manifest_url,
        raw: response,
      };
    },

    async getPickupLocations() {
      const response = await api.fetchPickupLocations(credentials);
      const locations = response?.data?.shipping_address || response?.shipping_address || [];
      return locations.map((loc) => ({
        locationId: String(loc.id || loc.pickup_location || loc.nickname),
        name: loc.pickup_location || loc.nickname || loc.name,
        address: loc.address || loc.address_2 || "",
        city: loc.city,
        state: loc.state,
        pincode: loc.pin_code || loc.pincode,
        phone: loc.phone,
      }));
    },

    webhook: {
      verifySignature({ rawBody, signature, secret }) {
        if (!secret || !signature) return !secret;
        const expected = crypto
          .createHmac("sha256", secret)
          .update(rawBody || "")
          .digest("hex");
        return expected === signature;
      },

      parseEvent(body) {
        const awb = body?.awb || body?.awb_code;
        const status = body?.current_status || body?.shipment_status || body?.status;
        return {
          awb,
          providerShipmentId: body?.shipment_id ? String(body.shipment_id) : undefined,
          status: mapStatus("shiprocket", status),
          message: body?.remark || body?.activity || status,
          raw: body,
        };
      },
    },
  };
}
