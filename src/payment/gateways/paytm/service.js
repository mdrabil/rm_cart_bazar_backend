import crypto from "crypto";
import { buildAutoSubmitFormHtml, shouldUseServerRedirect } from "../../config.js";

const URL = {
  development: "https://securegw-stage.paytm.in/theia/processTransaction",
  production: "https://securegw.paytm.in/theia/processTransaction",
};

const noopWebhook = { verifySignature: () => ({ valid: false }), parseEvent: () => ({}) };

export default function createPaytmService(credentials, gatewayDoc) {
  const base = () => URL[credentials.mode] || URL.development;
  const checksum = (params) => {
    const values = Object.keys(params).sort().map((k) => String(params[k] ?? "")).join("|");
    return crypto.createHash("sha256").update(`${values}|${credentials.secret}`).digest("hex");
  };

  return {
    gatewayName: gatewayDoc.gatewayName,
    async createPayment({ amount, sessionId, customer }) {
      const orderId = sessionId.replace(/-/g, "").slice(0, 30);
      const amountStr = Number(amount).toFixed(2);
      const params = { MID: credentials.keyId, ORDER_ID: orderId, CUST_ID: customer?.phone || orderId, TXN_AMOUNT: amountStr, CHANNEL_ID: "WEB", INDUSTRY_TYPE_ID: "Retail", WEBSITE: "DEFAULT", CALLBACK_URL: "" };
      return { gatewayOrderId: orderId, amountPaise: Math.round(amount * 100), metadata: { paytmUrl: base(), form: { ...params, CHECKSUMHASH: checksum(params) } } };
    },
    async verifyPayment({ orderId, paymentId, raw = {} }) {
      if (String(raw.STATUS || raw.status).toUpperCase() !== "TXN_SUCCESS") {
        throw new Error(`Paytm status: ${raw.STATUS || raw.status}`);
      }
      return { verified: true, transactionId: paymentId || raw.TXNID || orderId, gatewayOrderId: orderId, amount: Number(raw.TXNAMOUNT || 0), status: "SUCCESS", raw };
    },
    parseReturn(req) {
      const s = { ...(req.query || {}), ...(req.body || {}) };
      return { gatewayOrderId: s.ORDERID || s.orderId, transactionId: s.TXNID, signature: s.CHECKSUMHASH, raw: s };
    },
    getCspDirectives: () => ["form-action 'self' https://securegw-stage.paytm.in https://securegw.paytm.in"],
    buildCheckoutPage(data) {
      const sid = data.session.sessionId;
      const ret = `${data.apiBaseUrl}/api/payment/return/${sid}`;
      const form = { ...(data.session.metadata?.form || {}) };
      form.CALLBACK_URL = shouldUseServerRedirect(data.session.platform, data.apiBaseUrl) ? ret : data.session.returnUrl;
      return buildAutoSubmitFormHtml({ action: data.session.metadata?.paytmUrl || base(), fields: form });
    },
    webhook: noopWebhook,
  };
}
