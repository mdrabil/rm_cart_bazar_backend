import crypto from "crypto";
import { mapStatus, httpRequest } from "../../config.js";
import { CAPABILITIES, BASE_URL } from "./config.js";

function getBaseUrl(credentials) {
  return credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
}

export default function createDtdcService(credentials, gatewayDoc) {
  const logPrefix = "[DTDC]";

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const addr = payload.deliveryAddress || {};
      const receiver = payload.receiver || {};
      const pickup = payload.pickupLocation || {};

      const body = {
        consignments: [
          {
            customer_code: credentials.secret,
            service_type_id: "B2C SMART EXPRESS",
            load_type: "NON-DOCUMENT",
            description: (payload.items || []).map((i) => i.productName).join(", ") || "Products",
            dimension_unit: "cm",
            length: payload.dimensions?.length || 10,
            width: payload.dimensions?.width || 10,
            height: payload.dimensions?.height || 10,
            weight_unit: "kg",
            weight: payload.weight || 0.5,
            declared_value: payload.subTotal || 0,
            num_pieces: payload.packageCount || 1,
            origin_details: {
              name: pickup.name || "Pickup",
              phone: pickup.phone || "",
              address_line_1: pickup.address || "",
              pincode: pickup.pincode || "",
              city: pickup.city || "",
              state: pickup.state || "",
            },
            destination_details: {
              name: receiver.name,
              phone: receiver.phone,
              address_line_1: addr.addressLine || addr.fullAddress,
              pincode: addr.pincode,
              city: addr.city,
              state: addr.state || "",
            },
            reference_number: payload.orderReference,
            cod_collection_mode: payload.codAmount > 0 ? "cash" : undefined,
            cod_amount: payload.codAmount || 0,
          },
        ],
      };

      const response = await httpRequest(`${getBaseUrl(credentials)}/api/customer/integration/consignment/softdata`, {
        method: "POST",
        headers: {
          "api-key": credentials.keyId,
        },
        body: JSON.stringify(body),
      });

      const consignment = response?.data?.[0] || response?.consignments?.[0] || response;
      const awb = consignment?.reference_number || consignment?.awb_number || consignment?.awb;

      return {
        providerShipmentId: consignment?.id ? String(consignment.id) : awb ? String(awb) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: "DTDC",
        status: awb ? mapStatus("dtdc", "booked") : mapStatus("dtdc", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      console.log(`${logPrefix} trackShipment awb=${awb}`);

      const response = await httpRequest(
        `${getBaseUrl(credentials)}/api/customer/integration/consignment/track?reference_number=${encodeURIComponent(awb)}`,
        {
          method: "GET",
          headers: { "api-key": credentials.keyId },
        }
      );

      const status = response?.status || response?.consignment_status;

      return {
        status: mapStatus("dtdc", status),
        trackingHistory: (response?.tracking_events || []).map((entry) => ({
          status: entry.status,
          message: entry.description || entry.status,
          location: entry.location || "",
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          raw: entry,
        })),
        raw: response,
      };
    },

    async cancelShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${getBaseUrl(credentials)}/api/customer/integration/consignment/cancel`, {
        method: "POST",
        headers: { "api-key": credentials.keyId },
        body: JSON.stringify({ reference_number: awb }),
      });
      return { cancelled: true, raw: response };
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
        const awb = body?.reference_number || body?.awb;
        const status = body?.status || body?.consignment_status;
        return {
          awb,
          providerShipmentId: awb ? String(awb) : undefined,
          status: mapStatus("dtdc", status),
          message: body?.description || status,
          raw: body,
        };
      },
    },
  };
}
