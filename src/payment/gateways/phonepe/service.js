import crypto from "crypto";
import { escapeHtml } from "../../config.js";

const API = {
  development: "https://api-preprod.phonepe.com/apis/pg-sandbox",
  production: "https://api.phonepe.com/apis/hermes",
};

const noopWebhook = {
  verifySignature: () => ({ valid: false, eventId: null }),
  parseEvent: () => ({}),
};

export default function createPhonepeService(credentials, gatewayDoc) {
  const base = () => API[credentials.mode] || API.development;
  const merchantId = () => credentials.merchantId || credentials.keyId;

  return {
    gatewayName: gatewayDoc.gatewayName,

    async createPayment({ amount, sessionId, customer, returnUrl, apiBaseUrl }) {
      const payload = {
        merchantId: merchantId(),
        merchantTransactionId: sessionId,
        merchantUserId: String(customer?.phone || sessionId),
        amount: Math.round(amount * 100),
        redirectUrl: returnUrl || `${apiBaseUrl}/api/payment/return/${sessionId}`,
        redirectMode: "POST",
        callbackUrl: credentials.webhookUrl || `${apiBaseUrl}/api/payment/webhook/phonepe`,
        mobileNumber: customer?.phone || "9999999999",
        paymentInstrument: { type: "PAY_PAGE" },
      };
      const b64 = Buffer.from(JSON.stringify(payload)).toString("base64");
      const path = "/pg/v1/pay";
      const checksum = crypto.createHash("sha256").update(b64 + path + credentials.secret).digest("hex");
      const res = await fetch(`${base()}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-VERIFY": `${checksum}###1` },
        body: JSON.stringify({ request: b64 }),
      });
      const result = await res.json();
      const url = result?.data?.instrumentResponse?.redirectInfo?.url;
      if (!url) throw new Error(result?.message || "PhonePe initiation failed");
      return {
        gatewayOrderId: sessionId,
        publicKey: merchantId(),
        amountPaise: Math.round(amount * 100),
        metadata: { payUrl: url },
        raw: result,
      };
    },

    async verifyPayment({ orderId, paymentId, signature, raw = {} }) {
      const path = `/pg/v1/status/${merchantId()}/${orderId}`;
      const checksum = crypto.createHash("sha256").update(path + credentials.secret).digest("hex");
      const res = await fetch(`${base()}${path}`, {
        headers: { "X-VERIFY": `${checksum}###1`, "X-MERCHANT-ID": merchantId() },
      });
      const result = await res.json();
      const payment = result?.data;
      if (!payment || payment.state !== "COMPLETED") {
        throw new Error(`PhonePe status: ${payment?.state || "UNKNOWN"}`);
      }
      return {
        verified: true,
        transactionId: payment.transactionId || paymentId || orderId,
        gatewayOrderId: orderId,
        paymentMethodType: payment.paymentInstrument?.type || "unknown",
        amount: Number(payment.amount || 0) / 100,
        status: "SUCCESS",
        raw: payment,
        signature,
      };
    },

    parseReturn(req) {
      const s = { ...(req.query || {}), ...(req.body || {}) };
      return {
        gatewayOrderId: s.transactionId || s.merchantTransactionId || s.orderId,
        transactionId: s.transactionId || s.paymentId,
        signature: s.signature,
        raw: s,
      };
    },

    getCspDirectives: () => ["form-action 'self' https://api.phonepe.com https://api-preprod.phonepe.com"],

    buildCheckoutPage(data) {
      const url = escapeHtml(data.session.metadata?.payUrl || "");
      return `<!DOCTYPE html><html><body><script>location.replace("${url}");</script></body></html>`;
    },

    webhook: noopWebhook,
  };
}
