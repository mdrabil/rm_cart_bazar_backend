import crypto from "crypto";
import { BaseGateway } from "./baseGateway.js";
import {
  buildAutoSubmitFormHtml,
  shouldUseServerRedirect,
} from "./checkoutPageUtils.js";

const PAYTM_URL = {
  development: "https://securegw-stage.paytm.in/theia/processTransaction",
  production: "https://securegw.paytm.in/theia/processTransaction",
};

export class PaytmGateway extends BaseGateway {
  getCspDirectives() {
    return [
      "script-src 'self' 'unsafe-inline'",
      "form-action 'self' https://securegw-stage.paytm.in https://securegw.paytm.in",
    ];
  }

  generateChecksum(params) {
    const values = Object.keys(params)
      .sort()
      .map((key) => String(params[key] ?? ""))
      .join("|");

    return crypto
      .createHash("sha256")
      .update(`${values}|${this.credentials.secret}`)
      .digest("hex");
  }

  async generateCheckoutSession({ amount, currency = "INR", customer, sessionId }) {
    const orderId = sessionId.replace(/-/g, "").slice(0, 30);
    const amountStr = Number(amount).toFixed(2);
    const params = {
      MID: this.credentials.keyId,
      ORDER_ID: orderId,
      CUST_ID: customer?.phone || orderId,
      TXN_AMOUNT: amountStr,
      CHANNEL_ID: "WEB",
      INDUSTRY_TYPE_ID: "Retail",
      WEBSITE: "DEFAULT",
      CALLBACK_URL: "",
    };

    const checksum = this.generateChecksum(params);

    return {
      gatewayOrderId: orderId,
      publicKey: this.credentials.keyId,
      amount: Math.round(amount * 100),
      currency,
      gatewayName: this.gatewayName,
      metadata: {
        paytmUrl: PAYTM_URL[this.credentials.mode] || PAYTM_URL.development,
        form: { ...params, CHECKSUMHASH: checksum },
      },
    };
  }

  buildWebsiteClientCheckout({ checkout, returnUrl, cancelUrl }) {
    const form = {
      ...(checkout.metadata?.form || {}),
      CALLBACK_URL: returnUrl,
    };

    return {
      mode: "form",
      gatewayName: this.gatewayName,
      action: checkout.metadata?.paytmUrl,
      fields: form,
      orderId: checkout.gatewayOrderId,
    };
  }

  async verifyPayment({ orderId, paymentId, signature, raw = {} }) {
    if (String(raw.STATUS || raw.status).toUpperCase() !== "TXN_SUCCESS") {
      throw new Error(`Paytm payment status: ${raw.STATUS || raw.status}`);
    }

    return {
      verified: true,
      transactionId: paymentId || raw.TXNID || orderId,
      gatewayOrderId: orderId,
      paymentMethodType: raw.PAYMENTMODE || "unknown",
      amount: Number(raw.TXNAMOUNT || 0),
      raw,
      signature: signature || raw.CHECKSUMHASH,
    };
  }

  buildCheckoutPageHtml(data) {
    const sessionId = data.session.sessionId;
    const useRedirect = shouldUseServerRedirect(
      data.session.platform,
      data.apiBaseUrl
    );
    const returnEndpoint = `${data.apiBaseUrl}/api/payment/return/${sessionId}`;
    const form = { ...(data.session.metadata?.form || {}) };
    form.CALLBACK_URL = useRedirect
      ? returnEndpoint
      : data.session.returnUrl;

    return buildAutoSubmitFormHtml({
      action: data.session.metadata?.paytmUrl || PAYTM_URL.development,
      fields: form,
      title: "Paytm Payment",
    });
  }
}
