import crypto from "crypto";
import { BaseGateway } from "./baseGateway.js";
import {
  buildAutoSubmitFormHtml,
  escapeHtml,
  shouldUseServerRedirect,
  CLIENT_HELPERS,
} from "./checkoutPageUtils.js";

const PAYU_BASE = {
  development: "https://test.payu.in/_payment",
  production: "https://secure.payu.in/_payment",
};

export class PayUGateway extends BaseGateway {
  getCspDirectives() {
    return [
      "script-src 'self' 'unsafe-inline'",
      "form-action 'self' https://test.payu.in https://secure.payu.in",
    ];
  }

  buildHash({ txnid, amount, productinfo, firstname, email }) {
    const hashString = [
      this.credentials.keyId,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      this.credentials.secret,
    ].join("|");

    return crypto.createHash("sha512").update(hashString).digest("hex");
  }

  verifyReverseHash(raw) {
    const hashString = [
      this.credentials.secret,
      raw.status,
      "",
      "",
      "",
      "",
      "",
      raw.udf5 || "",
      raw.udf4 || "",
      raw.udf3 || "",
      raw.udf2 || "",
      raw.udf1 || "",
      raw.email,
      raw.firstname,
      raw.productinfo,
      raw.amount,
      raw.txnid,
      this.credentials.keyId,
    ].join("|");

    const expected = crypto.createHash("sha512").update(hashString).digest("hex");
    return expected === raw.hash;
  }

  async generateCheckoutSession({ amount, currency = "INR", customer, sessionId }) {
    const txnid = sessionId.replace(/-/g, "").slice(0, 25);
    const amountStr = Number(amount).toFixed(2);
    const productinfo = "MR Brand Order";
    const firstname = customer?.name || "Customer";
    const email = customer?.email || "customer@example.com";
    const phone = customer?.phone || "9999999999";
    const hash = this.buildHash({
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email,
    });

    return {
      gatewayOrderId: txnid,
      publicKey: this.credentials.keyId,
      amount: Math.round(amount * 100),
      currency,
      gatewayName: this.gatewayName,
      metadata: {
        payuUrl: PAYU_BASE[this.credentials.mode] || PAYU_BASE.development,
        form: {
          key: this.credentials.keyId,
          txnid,
          amount: amountStr,
          productinfo,
          firstname,
          email,
          phone,
          surl: "",
          furl: "",
          hash,
        },
      },
    };
  }

  buildWebsiteClientCheckout({ checkout, returnUrl, cancelUrl }) {
    const form = {
      ...(checkout.metadata?.form || {}),
      surl: returnUrl,
      furl: cancelUrl,
      service_provider: "payu_paisa",
    };

    return {
      mode: "form",
      gatewayName: this.gatewayName,
      action: checkout.metadata?.payuUrl,
      fields: form,
      orderId: checkout.gatewayOrderId,
    };
  }

  async verifyPayment({ orderId, paymentId, signature, raw = {} }) {
    const payload = { ...raw, hash: signature, txnid: orderId, mihpayid: paymentId };
    if (!this.verifyReverseHash(payload)) {
      throw new Error("PayU payment verification failed");
    }

    if (String(payload.status).toLowerCase() !== "success") {
      throw new Error(`PayU payment status: ${payload.status}`);
    }

    return {
      verified: true,
      transactionId: paymentId,
      gatewayOrderId: orderId,
      paymentMethodType: payload.mode || "unknown",
      amount: Number(payload.amount || 0),
      raw: payload,
      signature,
    };
  }

  buildCheckoutPageHtml(data) {
    const sessionId = escapeHtml(data.session.sessionId);
    const form = data.session.metadata?.form || {};
    const useRedirect = shouldUseServerRedirect(
      data.session.platform,
      data.apiBaseUrl
    );
    const returnEndpoint = `${data.apiBaseUrl}/api/payment/return/${sessionId}`;
    const cancelEndpoint = data.session.cancelUrl
      ? data.session.cancelUrl
      : `${data.apiBaseUrl}/api/payment/return/${sessionId}?status=cancelled`;

    const fields = {
      ...form,
      surl: useRedirect ? returnEndpoint : data.session.returnUrl,
      furl: cancelEndpoint,
      service_provider: "payu_paisa",
    };

    return buildAutoSubmitFormHtml({
      action: data.session.metadata?.payuUrl || PAYU_BASE.development,
      fields,
      title: "PayU Payment",
    });
  }
}
