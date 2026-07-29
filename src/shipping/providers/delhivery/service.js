import crypto from "crypto";
import { mapStatus } from "../../config.js";
import { CAPABILITIES } from "./config.js";
import * as api from "./api.js";

export default function createDelhiveryService(credentials, gatewayDoc) {
  const logPrefix = "[Delhivery]";
  const clientName = credentials.merchantId || credentials.secret;

  return {
    providerName: gatewayDoc.providerName,
    capabilities: CAPABILITIES,

    async createShipment(payload) {
      console.log(`${logPrefix} createShipment orderRef=${payload.orderReference}`);
      const delhiveryPayload = api.buildShipmentPayload(payload, clientName);
      const response = await api.createShipment(credentials, delhiveryPayload);

      const packageInfo = response?.packages?.[0] || response?.ShipmentData?.[0]?.Shipment || {};
      const awb = packageInfo?.waybill || packageInfo?.AWB;

      return {
        providerShipmentId: awb ? String(awb) : undefined,
        awb: awb || undefined,
        trackingNumber: awb || undefined,
        courierName: "Delhivery",
        status: awb ? mapStatus("delhivery", "booked") : mapStatus("delhivery", "pending"),
        raw: response,
      };
    },

    async trackShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      console.log(`${logPrefix} trackShipment awb=${awb}`);
      const response = await api.trackByWaybill(credentials, awb);
      const shipment = response?.ShipmentData?.[0]?.Shipment || {};
      const scans = shipment?.Scans || [];

      const history = scans.map((entry) => ({
        status: entry?.ScanDetail?.Scan,
        message: entry?.ScanDetail?.Instructions || entry?.ScanDetail?.Scan,
        location: entry?.ScanDetail?.ScannedLocation || "",
        timestamp: entry?.ScanDetail?.ScanDateTime
          ? new Date(entry.ScanDetail.ScanDateTime)
          : new Date(),
        raw: entry,
      }));

      const currentStatus = shipment?.Status?.Status || history[0]?.status;

      return {
        status: mapStatus("delhivery", currentStatus),
        trackingHistory: history,
        raw: response,
      };
    },

    async cancelShipment({ awb }) {
      if (!awb) return { skipped: true, reason: "AWB not available" };
      console.log(`${logPrefix} cancelShipment awb=${awb}`);
      const response = await api.cancelShipment(credentials, awb);
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
        const awb = body?.waybill || body?.AWB;
        const status = body?.Status || body?.status;
        return {
          awb,
          providerShipmentId: awb ? String(awb) : undefined,
          status: mapStatus("delhivery", status),
          message: body?.Remarks || status,
          raw: body,
        };
      },
    },
  };
}
