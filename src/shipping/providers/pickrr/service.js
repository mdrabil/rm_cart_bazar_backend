import { mapStatus, httpRequest } from "../../config.js";
import { CAPABILITIES, BASE_URL } from "./config.js";

export default function createPickrrService(credentials, gatewayDoc) {
  const logPrefix = "[Pickrr]";
  const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const addr = payload.deliveryAddress || {};
      const receiver = payload.receiver || {};
      const pickup = payload.pickupLocation || {};

      const response = await httpRequest(`${base}/place-order/`, {
        method: "POST",
        body: JSON.stringify({
          auth_token: credentials.keyId,
          item_name: (payload.items || []).map((i) => i.productName).join(", ") || "Products",
          from_name: pickup.name || credentials.secret || "Pickup",
          from_phone_number: pickup.phone || "",
          from_address: pickup.address || "",
          from_pincode: pickup.pincode || "",
          to_name: receiver.name,
          to_phone_number: receiver.phone,
          to_pincode: addr.pincode,
          to_address: addr.addressLine || addr.fullAddress,
          quantity: payload.packageCount || 1,
          invoice_value: payload.subTotal || 0,
          cod_amount: payload.codAmount || 0,
          weight: payload.weight || 0.5,
          order_id: payload.orderReference,
        }),
      });

      const awb = response?.tracking_id || response?.order_id;

      return {
        providerShipmentId: awb ? String(awb) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: response?.courier || "Pickrr",
        status: awb ? mapStatus("pickrr", "booked") : mapStatus("pickrr", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(
        `${base}/tracking/?auth_token=${encodeURIComponent(credentials.keyId)}&tracking_id=${encodeURIComponent(awb)}`,
        { method: "GET" }
      );
      const status = response?.status?.current_status_type;
      return {
        status: mapStatus("pickrr", status),
        trackingHistory: (response?.status?.status_list || []).map((entry) => ({
          status: entry.status_name,
          message: entry.status_name,
          location: entry.location || "",
          timestamp: entry.datetime ? new Date(entry.datetime) : new Date(),
          raw: entry,
        })),
        raw: response,
      };
    },

    async cancelShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${base}/order/cancel/`, {
        method: "POST",
        body: JSON.stringify({ auth_token: credentials.keyId, tracking_id: awb }),
      });
      return { cancelled: true, raw: response };
    },

    async getLabel({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(
        `${base}/order/label/?auth_token=${encodeURIComponent(credentials.keyId)}&tracking_id=${encodeURIComponent(awb)}`,
        { method: "GET" }
      );
      return { labelUrl: response?.label_url, raw: response };
    },
  };
}
