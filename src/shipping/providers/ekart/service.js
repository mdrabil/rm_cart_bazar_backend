import { mapStatus, httpRequest } from "../../config.js";
import { CAPABILITIES, BASE_URL } from "./config.js";

export default function createEkartService(credentials, gatewayDoc) {
  const logPrefix = "[Ekart]";
  const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const addr = payload.deliveryAddress || {};
      const receiver = payload.receiver || {};

      const response = await httpRequest(`${base}/v2/shipments/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.keyId}`,
          "X-Client-Id": credentials.secret,
        },
        body: JSON.stringify({
          shipment_id: payload.orderReference,
          customer_name: receiver.name,
          customer_phone: receiver.phone,
          customer_address: addr.addressLine || addr.fullAddress,
          customer_city: addr.city,
          customer_state: addr.state || "",
          customer_pincode: addr.pincode,
          payment_mode: payload.codAmount > 0 ? "COD" : "Prepaid",
          cod_amount: payload.codAmount || 0,
          weight: payload.weight || 0.5,
          length: payload.dimensions?.length || 10,
          width: payload.dimensions?.width || 10,
          height: payload.dimensions?.height || 10,
          quantity: payload.packageCount || 1,
        }),
      });

      const awb = response?.tracking_id || response?.awb || response?.data?.tracking_id;

      return {
        providerShipmentId: response?.shipment_id ? String(response.shipment_id) : awb ? String(awb) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: "Ekart",
        status: awb ? mapStatus("ekart", "booked") : mapStatus("ekart", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${base}/v2/shipments/track/${encodeURIComponent(awb)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${credentials.keyId}` },
      });
      const status = response?.status || response?.data?.status;
      return {
        status: mapStatus("ekart", status),
        trackingHistory: (response?.history || []).map((entry) => ({
          status: entry.status,
          message: entry.description || entry.status,
          location: entry.location || "",
          timestamp: entry.time ? new Date(entry.time) : new Date(),
          raw: entry,
        })),
        raw: response,
      };
    },

    async cancelShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${base}/v2/shipments/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.keyId}` },
        body: JSON.stringify({ tracking_id: awb }),
      });
      return { cancelled: true, raw: response };
    },

    async getLabel({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${base}/v2/shipments/label/${encodeURIComponent(awb)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${credentials.keyId}` },
      });
      return { labelUrl: response?.label_url || response?.data?.label_url, raw: response };
    },
  };
}
