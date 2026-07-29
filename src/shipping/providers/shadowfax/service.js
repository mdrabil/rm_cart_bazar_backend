import { mapStatus, httpRequest } from "../../config.js";
import { CAPABILITIES, BASE_URL } from "./config.js";

export default function createShadowfaxService(credentials, gatewayDoc) {
  const logPrefix = "[Shadowfax]";

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const addr = payload.deliveryAddress || {};
      const receiver = payload.receiver || {};

      const response = await httpRequest(`${BASE_URL}/api/v3/clients/orders/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${credentials.keyId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_code: credentials.secret,
          order_details: {
            client_order_id: payload.orderReference,
            product_value: payload.subTotal || 0,
            cod_amount: payload.codAmount || 0,
            payment_mode: payload.codAmount > 0 ? "COD" : "Prepaid",
            weight: payload.weight || 0.5,
          },
          customer_details: {
            name: receiver.name,
            contact: receiver.phone,
            address_line_1: addr.addressLine || addr.fullAddress,
            city: addr.city,
            state: addr.state || "",
            pincode: addr.pincode,
          },
        }),
      });

      const awb = response?.awb_number || response?.data?.awb_number;

      return {
        providerShipmentId: response?.order_id ? String(response.order_id) : awb ? String(awb) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: "Shadowfax",
        status: awb ? mapStatus("shadowfax", "booked") : mapStatus("shadowfax", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${BASE_URL}/api/v3/clients/orders/track/${encodeURIComponent(awb)}`, {
        method: "GET",
        headers: { Authorization: `Token ${credentials.keyId}` },
      });
      const status = response?.status || response?.order_status;
      return {
        status: mapStatus("shadowfax", status),
        trackingHistory: (response?.tracking_details || []).map((entry) => ({
          status: entry.status,
          message: entry.description || entry.status,
          location: entry.location || "",
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          raw: entry,
        })),
        raw: response,
      };
    },

    async cancelShipment({ awb, providerShipmentId }) {
      const id = providerShipmentId || awb;
      if (!id) return { skipped: true, reason: "Shipment reference missing" };
      const response = await httpRequest(`${BASE_URL}/api/v3/clients/orders/cancel`, {
        method: "POST",
        headers: { Authorization: `Token ${credentials.keyId}` },
        body: JSON.stringify({ order_id: id }),
      });
      return { cancelled: true, raw: response };
    },

    async getLabel({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${BASE_URL}/api/v3/clients/orders/label/${encodeURIComponent(awb)}`, {
        method: "GET",
        headers: { Authorization: `Token ${credentials.keyId}` },
      });
      return { labelUrl: response?.label_url, raw: response };
    },
  };
}
