import { mapStatus, httpRequest } from "../../config.js";
import { CAPABILITIES, BASE_URL } from "./config.js";

let cachedToken = null;

async function authenticate(credentials) {
  if (cachedToken) return cachedToken;

  const response = await httpRequest(`${BASE_URL.development}/api/users/login`, {
    method: "POST",
    body: JSON.stringify({
      email: credentials.keyId,
      password: credentials.secret,
    }),
  });

  cachedToken = response?.data?.token || response?.token;
  if (!cachedToken) throw new Error("XpressBees authentication failed");
  return cachedToken;
}

export default function createXpressbeesService(credentials, gatewayDoc) {
  const logPrefix = "[XpressBees]";
  const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const token = await authenticate(credentials);
      const addr = payload.deliveryAddress || {};
      const receiver = payload.receiver || {};

      const body = {
        order_id: payload.orderReference,
        order_amount: payload.subTotal || payload.codAmount || 0,
        cod_amount: payload.codAmount || 0,
        consignee_name: receiver.name,
        consignee_mobile: receiver.phone,
        consignee_address: addr.addressLine || addr.fullAddress,
        consignee_city: addr.city,
        consignee_state: addr.state || "",
        consignee_pincode: addr.pincode,
        weight: payload.weight || 0.5,
        length: payload.dimensions?.length || 10,
        width: payload.dimensions?.width || 10,
        height: payload.dimensions?.height || 10,
        quantity: payload.packageCount || 1,
      };

      const response = await httpRequest(`${base}/api/shipments/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const awb = response?.data?.awb_number || response?.awb_number || response?.awb;

      return {
        providerShipmentId: response?.data?.shipment_id
          ? String(response.data.shipment_id)
          : awb
            ? String(awb)
            : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: "XpressBees",
        status: awb ? mapStatus("xpressbees", "booked") : mapStatus("xpressbees", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      console.log(`${logPrefix} trackShipment awb=${awb}`);
      const token = await authenticate(credentials);

      const response = await httpRequest(`${base}/api/shipments/track/${encodeURIComponent(awb)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const status = response?.data?.status || response?.status;

      return {
        status: mapStatus("xpressbees", status),
        trackingHistory: (response?.data?.tracking || []).map((entry) => ({
          status: entry.status,
          message: entry.remark || entry.status,
          location: entry.location || "",
          timestamp: entry.date ? new Date(entry.date) : new Date(),
          raw: entry,
        })),
        raw: response,
      };
    },

    async cancelShipment({ awb, providerShipmentId }) {
      const id = providerShipmentId || awb;
      if (!id) return { skipped: true, reason: "Shipment reference missing" };
      const token = await authenticate(credentials);
      const response = await httpRequest(`${base}/api/shipments/cancel/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return { cancelled: true, raw: response };
    },

    async getLabel({ awb, providerShipmentId }) {
      const id = providerShipmentId || awb;
      if (!id) return { skipped: true, reason: "Shipment reference missing" };
      const token = await authenticate(credentials);
      const response = await httpRequest(`${base}/api/shipments/label/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        labelUrl: response?.data?.label_url || response?.label_url,
        raw: response,
      };
    },
  };
}
