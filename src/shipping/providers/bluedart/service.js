import { mapStatus, httpRequest } from "../../config.js";
import { CAPABILITIES, BASE_URL } from "./config.js";

function getBaseUrl(credentials) {
  return credentials.mode === "production" ? BASE_URL.production : BASE_URL.development;
}

export default function createBluedartService(credentials, gatewayDoc) {
  const logPrefix = "[BlueDart]";

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const addr = payload.deliveryAddress || {};
      const receiver = payload.receiver || {};

      const requestBody = {
        Request: {
          LoginID: credentials.keyId,
          LicenceKey: credentials.secret,
          CustomerCode: credentials.merchantId,
          Consignee: {
            ConsigneeName: receiver.name,
            ConsigneeAddress1: addr.addressLine || addr.fullAddress,
            ConsigneeCity: addr.city,
            ConsigneePincode: addr.pincode,
            ConsigneeState: addr.state || "",
            ConsigneeMobile: receiver.phone,
          },
          Services: {
            ProductCode: "A",
            SubProductCode: payload.codAmount > 0 ? "C" : "P",
            PieceCount: payload.packageCount || 1,
            ActualWeight: payload.weight || 0.5,
            CreditReferenceNo: payload.orderReference,
            CollectableAmount: payload.codAmount || 0,
          },
        },
      };

      const response = await httpRequest(`${getBaseUrl(credentials)}?action=GenerateWayBill`, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const awb =
        response?.GenerateWayBillResult?.AWBNo ||
        response?.AWBNo ||
        response?.awb;

      return {
        providerShipmentId: awb ? String(awb) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: "BlueDart",
        status: awb ? mapStatus("bluedart", "booked") : mapStatus("bluedart", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      console.log(`${logPrefix} trackShipment awb=${awb}`);

      const response = await httpRequest(`${getBaseUrl(credentials)}?action=GetShipmentStatus`, {
        method: "POST",
        body: JSON.stringify({
          Request: {
            LoginID: credentials.keyId,
            LicenceKey: credentials.secret,
            AWBNo: awb,
          },
        }),
      });

      const status =
        response?.GetShipmentStatusResult?.Status ||
        response?.Status ||
        response?.status;

      return {
        status: mapStatus("bluedart", status),
        trackingHistory: [],
        raw: response,
      };
    },

    async getInvoice({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      const response = await httpRequest(`${getBaseUrl(credentials)}?action=GetInvoice`, {
        method: "POST",
        body: JSON.stringify({
          Request: {
            LoginID: credentials.keyId,
            LicenceKey: credentials.secret,
            AWBNo: awb,
          },
        }),
      });
      return {
        invoiceUrl: response?.invoice_url || response?.GetInvoiceResult?.InvoiceURL,
        raw: response,
      };
    },
  };
}
