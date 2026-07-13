import crypto from "crypto";
import { buildAutoSubmitFormHtml, shouldUseServerRedirect } from "../../config.js";

const PAYU_URL = {
  development: "https://test.payu.in/_payment",
  production: "https://secure.payu.in/_payment",
};

const noopWebhook = {
  verifySignature: () => ({ valid: false, eventId: null }),
  parseEvent: () => ({}),
};

export default function createPayuService(credentials, gatewayDoc) {
  const payuBase = () => PAYU_URL[credentials.mode] || PAYU_URL.development;

  const buildHash = ({ txnid, amount, productinfo, firstname, email }) => {
    const s = [credentials.keyId, txnid, amount, productinfo, firstname, email, "", "", "", "", "", "", "", "", "", credentials.secret].join("|");
    return crypto.createHash("sha512").update(s).digest("hex");
  };

  const verifyReverseHash = (raw) => {
    const s = [credentials.secret, raw.status, "", "", "", "", "", raw.udf5 || "", raw.udf4 || "", raw.udf3 || "", raw.udf2 || "", raw.udf1 || "", raw.email, raw.firstname, raw.productinfo, raw.amount, raw.txnid, credentials.keyId].join("|");
    return crypto.createHash("sha512").update(s).digest("hex") === raw.hash;
  };

  return {
    gatewayName: gatewayDoc.gatewayName,

    async createPayment({ amount, sessionId, customer }) {
      const txnid = sessionId.replace(/-/g, "").slice(0, 25);
      const amountStr = Number(amount).toFixed(2);
      const productinfo = "MR Brand Order";
      const firstname = customer?.name || "Customer";
      const email = customer?.email || "customer@example.com";
      const phone = customer?.phone || "9999999999";
      const hash = buildHash({ txnid, amount: amountStr, productinfo, firstname, email });
      return {
        gatewayOrderId: txnid,
        publicKey: credentials.keyId,
        amountPaise: Math.round(amount * 100),
        metadata: {
          payuUrl: payuBase(),
          form: { key: credentials.keyId, txnid, amount: amountStr, productinfo, firstname, email, phone, surl: "", furl: "", hash },
        },
      };
    },

    async verifyPayment({ orderId, paymentId, signature, raw = {} }) {
      const payload = { ...raw, hash: signature, txnid: orderId, mihpayid: paymentId };
      if (!verifyReverseHash(payload)) throw new Error("PayU verification failed");
      if (String(payload.status).toLowerCase() !== "success") {
        throw new Error(`PayU status: ${payload.status}`);
      }
      return {
        verified: true,
        transactionId: paymentId,
        gatewayOrderId: orderId,
        paymentMethodType: payload.mode || "unknown",
        amount: Number(payload.amount || 0),
        status: "SUCCESS",
        raw: payload,
      };
    },

    parseReturn(req) {
      const s = { ...(req.query || {}), ...(req.body || {}) };
      return {
        gatewayOrderId: s.txnid || s.orderId,
        transactionId: s.mihpayid || s.paymentId,
        signature: s.hash,
        raw: s,
      };
    },

    getCspDirectives: () => ["form-action 'self' https://test.payu.in https://secure.payu.in"],

    buildCheckoutPage(data) {
      const sid = data.session.sessionId;
      const useRedirect = shouldUseServerRedirect(data.session.platform, data.apiBaseUrl);
      const ret = `${data.apiBaseUrl}/api/payment/return/${sid}`;
      const fields = {
        ...(data.session.metadata?.form || {}),
        surl: useRedirect ? ret : data.session.returnUrl,
        furl: data.session.cancelUrl || `${ret}?status=failed`,
        service_provider: "payu_paisa",
      };
      return buildAutoSubmitFormHtml({ action: data.session.metadata?.payuUrl || payuBase(), fields });
    },

    webhook: noopWebhook,
  };
}
