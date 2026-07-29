import { mapStatus, httpRequest } from "../../config.js";
import { CAPABILITIES, BASE_URL } from "./config.js";

async function getAccessToken(credentials) {
  const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
  const response = await httpRequest(`${base}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: credentials.keyId,
      client_secret: credentials.secret,
    }).toString(),
  });
  if (!response?.access_token) throw new Error("FedEx authentication failed");
  return response.access_token;
}

export default function createFedexService(credentials, gatewayDoc) {
  const logPrefix = "[FedEx]";

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const token = await getAccessToken(credentials);
      const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
      const addr = payload.deliveryAddress || {};
      const receiver = payload.receiver || {};

      const response = await httpRequest(`${base}/ship/v1/shipments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          labelResponseOptions: "URL_ONLY",
          accountNumber: { value: credentials.merchantId },
          requestedShipment: {
            shipper: { contact: { personName: "Shipper", phoneNumber: "9999999999" } },
            recipients: [{
              contact: { personName: receiver.name, phoneNumber: receiver.phone },
              address: {
                streetLines: [addr.addressLine || addr.fullAddress || ""],
                city: addr.city,
                stateOrProvinceCode: addr.state || "",
                postalCode: addr.pincode,
                countryCode: "IN",
              },
            }],
            serviceType: "STANDARD_OVERNIGHT",
            packagingType: "YOUR_PACKAGING",
            pickupType: "USE_ACCOUNT_ADDRESS",
            shippingChargesPayment: { paymentType: "SENDER" },
            requestedPackageLineItems: [{
              weight: { units: "KG", value: payload.weight || 0.5 },
              dimensions: {
                length: payload.dimensions?.length || 10,
                width: payload.dimensions?.width || 10,
                height: payload.dimensions?.height || 10,
                units: "CM",
              },
            }],
          },
        }),
      });

      const awb =
        response?.output?.transactionShipments?.[0]?.masterTrackingNumber ||
        response?.output?.transactionShipments?.[0]?.pieceResponses?.[0]?.trackingNumber;

      return {
        providerShipmentId: awb ? String(awb) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: "FedEx",
        status: awb ? mapStatus("fedex", "booked") : mapStatus("fedex", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const token = await getAccessToken(credentials);
      const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
      const response = await httpRequest(`${base}/track/v1/trackingnumbers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          trackingInfo: [{ trackingNumberInfo: { trackingNumber: awb } }],
          includeDetailedScans: true,
        }),
      });
      const trackResult = response?.output?.completeTrackResults?.[0]?.trackResults?.[0];
      const status = trackResult?.latestStatusDetail?.code;
      return {
        status: mapStatus("fedex", status),
        trackingHistory: (trackResult?.scanEvents || []).map((entry) => ({
          status: entry.eventType,
          message: entry.eventDescription || entry.eventType,
          location: entry.scanLocation?.city || "",
          timestamp: entry.date ? new Date(entry.date) : new Date(),
          raw: entry,
        })),
        raw: response,
      };
    },

    async cancelShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const token = await getAccessToken(credentials);
      const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
      const response = await httpRequest(`${base}/ship/v1/shipments/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          accountNumber: { value: credentials.merchantId },
          trackingNumber: awb,
        }),
      });
      return { cancelled: true, raw: response };
    },

    async getLabel({ awb, providerShipmentId }) {
      const id = awb || providerShipmentId;
      if (!id) return { skipped: true, reason: "Tracking reference missing" };
      const token = await getAccessToken(credentials);
      const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
      const response = await httpRequest(`${base}/ship/v1/shipments/${encodeURIComponent(id)}/documents`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        labelUrl: response?.output?.url || response?.url,
        raw: response,
      };
    },

    async getInvoice({ awb, providerShipmentId }) {
      const id = awb || providerShipmentId;
      if (!id) return { skipped: true, reason: "Tracking reference missing" };
      const token = await getAccessToken(credentials);
      const base = credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
      const response = await httpRequest(`${base}/ship/v1/shipments/${encodeURIComponent(id)}/documents/commercial-invoice`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      return {
        invoiceUrl: response?.output?.url || response?.url,
        raw: response,
      };
    },
  };
}
