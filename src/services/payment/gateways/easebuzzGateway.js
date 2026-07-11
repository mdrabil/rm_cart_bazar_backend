import crypto from "crypto";
import { BaseGateway } from "./baseGateway.js";
import {
  buildAutoSubmitFormHtml,
  shouldUseServerRedirect,
} from "./checkoutPageUtils.js";

const EASEBUZZ_URL = {
  development: "https://testpay.easebuzz.in/pay/secure",
  production: "https://pay.easebuzz.in/pay/secure",
};

export class EasebuzzGateway extends BaseGateway {
  getCspDirectives() {
    return [
      "script-src 'self' 'unsafe-inline'",
      "form-action 'self' https://testpay.easebuzz.in https://pay.easebuzz.in",
    ];
  }

  buildHash({ txnid, amount, productinfo, firstname, email, phone }) {
    const sequence = [
      this.credentials.keyId,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone || "9999999999",
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
    ];
    return crypto.createHash("sha512").update(sequence.join("|")).digest("hex");
  }

  async generateCheckoutSession({ amount, currency = "INR", customer, sessionId }) {
    const txnid = sessionId.replace(/-/g, "").slice(0, 30);
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
      phone,
    });

    return {
      gatewayOrderId: txnid,
      publicKey: this.credentials.keyId,
      amount: Math.round(amount * 100),
      currency,
      gatewayName: this.gatewayName,
      metadata: {
        easebuzzUrl: EASEBUZZ_URL[this.credentials.mode] || EASEBUZZ_URL.development,
        form: {
          key: this.credentials.keyId,
          txnid,
          amount: amountStr,
          productinfo,
          firstname,
          email,
          phone,
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
    };

    return {
      mode: "form",
      gatewayName: this.gatewayName,
      action: checkout.metadata?.easebuzzUrl,
      fields: form,
      orderId: checkout.gatewayOrderId,
    };
  }

  async verifyPayment({ orderId, paymentId, signature, raw = {} }) {
    if (String(raw.status).toLowerCase() !== "success") {
      throw new Error(`Easebuzz payment status: ${raw.status}`);
    }

    return {
      verified: true,
      transactionId: paymentId || raw.easepayid || orderId,
      gatewayOrderId: orderId,
      paymentMethodType: raw.mode || "unknown",
      amount: Number(raw.amount || 0),
      raw,
      signature: signature || raw.hash,
    };
  }

  buildCheckoutPageHtml(data) {
    const sessionId = data.session.sessionId;
    const useRedirect = shouldUseServerRedirect(
      data.session.platform,
      data.apiBaseUrl
    );
    const returnEndpoint = `${data.apiBaseUrl}/api/payment/return/${sessionId}`;

    const fields = {
      ...(data.session.metadata?.form || {}),
      surl: useRedirect ? returnEndpoint : data.session.returnUrl,
      furl: data.session.cancelUrl || `${returnEndpoint}?status=failed`,
    };

    return buildAutoSubmitFormHtml({
      action: data.session.metadata?.easebuzzUrl || EASEBUZZ_URL.development,
      fields,
      title: "Easebuzz Payment",
    });
  }
}
