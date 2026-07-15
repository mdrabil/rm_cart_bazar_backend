import crypto from "crypto";
import { buildAutoSubmitFormHtml, shouldUseServerRedirect } from "../../config.js";

const URL = {
  development: "https://testpay.easebuzz.in/pay/secure",
  production: "https://pay.easebuzz.in/pay/secure",
};

const noopWebhook = { verifySignature: () => ({ valid: false }), parseEvent: () => ({}) };

export default function createEasebuzzService(credentials, gatewayDoc) {
  const base = () => URL[credentials.mode] || URL.development;
  const buildHash = ({ txnid, amount, productinfo, firstname, email, phone }) => {
    const seq = [credentials.keyId, txnid, amount, productinfo, firstname, email, phone || "9999999999", "", "", "", "", "", "", "", "", "", credentials.secret];
    return crypto.createHash("sha512").update(seq.join("|")).digest("hex");
  };

  return {
    gatewayName: gatewayDoc.gatewayName,
    async createPayment({ amount, sessionId, customer }) {
      const txnid = sessionId.replace(/-/g, "").slice(0, 30);
      const amountStr = Number(amount).toFixed(2);
      const form = {
        key: credentials.keyId,
        txnid,
        amount: amountStr,
        productinfo: "MRcrafted Order",
        firstname: customer?.name || "Customer",
        email: customer?.email || "customer@example.com",
        phone: customer?.phone || "9999999999",
        hash: buildHash({ txnid, amount: amountStr, productinfo: "MRcrafted Order", firstname: customer?.name || "Customer", email: customer?.email || "customer@example.com", phone: customer?.phone }),
      };
      return { gatewayOrderId: txnid, amountPaise: Math.round(amount * 100), metadata: { easebuzzUrl: base(), form } };
    },
    async verifyPayment({ orderId, paymentId, signature, raw = {} }) {
      if (String(raw.status).toLowerCase() !== "success") throw new Error(`Easebuzz status: ${raw.status}`);
      return { verified: true, transactionId: paymentId || raw.easepayid || orderId, gatewayOrderId: orderId, amount: Number(raw.amount || 0), status: "SUCCESS", raw };
    },
    parseReturn(req) {
      const s = { ...(req.query || {}), ...(req.body || {}) };
      return { gatewayOrderId: s.txnid, transactionId: s.easepayid, signature: s.hash, raw: s };
    },
    getCspDirectives: () => ["form-action 'self' https://testpay.easebuzz.in https://pay.easebuzz.in"],
    buildCheckoutPage(data) {
      const sid = data.session.sessionId;
      const ret = `${data.apiBaseUrl}/api/payment/return/${sid}`;
      const useRedirect = shouldUseServerRedirect(data.session.platform, data.apiBaseUrl);
      const fields = { ...(data.session.metadata?.form || {}), surl: useRedirect ? ret : data.session.returnUrl, furl: data.session.cancelUrl || `${ret}?status=failed` };
      return buildAutoSubmitFormHtml({ action: data.session.metadata?.easebuzzUrl || base(), fields });
    },
    webhook: noopWebhook,
  };
}
