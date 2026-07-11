import crypto from "crypto";
import { BaseGateway } from "./baseGateway.js";
import { escapeHtml } from "./checkoutPageUtils.js";

const PHONEPE_API = {
  development: "https://api-preprod.phonepe.com/apis/pg-sandbox",
  production: "https://api.phonepe.com/apis/hermes",
};

export class PhonePeGateway extends BaseGateway {
  getApiBase() {
    return PHONEPE_API[this.credentials.mode] || PHONEPE_API.development;
  }

  getCspDirectives() {
    return [
      "script-src 'self' 'unsafe-inline'",
      "form-action 'self' https://api-preprod.phonepe.com https://api.phonepe.com https://mercury-uat.phonepe.com https://mercury.phonepe.com",
    ];
  }

  async generateCheckoutSession({
    amount,
    currency = "INR",
    customer,
    sessionId,
    returnUrl,
    apiBaseUrl,
  }) {
    const merchantId = this.credentials.merchantId || this.credentials.keyId;
    const payload = {
      merchantId,
      merchantTransactionId: sessionId,
      merchantUserId: String(customer?.phone || sessionId),
      amount: Math.round(amount * 100),
      redirectUrl: returnUrl || `${apiBaseUrl}/api/payment/return/${sessionId}`,
      redirectMode: "POST",
      callbackUrl: `${apiBaseUrl}/api/payment/webhook/PhonePe`,
      mobileNumber: customer?.phone || "9999999999",
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
    const path = "/pg/v1/pay";
    const checksum = crypto
      .createHash("sha256")
      .update(base64Payload + path + this.credentials.secret)
      .digest("hex");
    const xVerify = `${checksum}###1`;

    const response = await fetch(`${this.getApiBase()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const result = await response.json();

    if (!response.ok || !result?.data?.instrumentResponse?.redirectInfo?.url) {
      throw new Error(
        result?.message || result?.code || "PhonePe payment initiation failed"
      );
    }

    return {
      gatewayOrderId: sessionId,
      publicKey: merchantId,
      amount: Math.round(amount * 100),
      currency,
      gatewayName: this.gatewayName,
      metadata: {
        payUrl: result.data.instrumentResponse.redirectInfo.url,
      },
      raw: result,
    };
  }

  buildWebsiteClientCheckout({ checkout }) {
    return {
      mode: "redirect",
      gatewayName: this.gatewayName,
      redirectUrl: checkout.metadata?.payUrl,
      orderId: checkout.gatewayOrderId,
    };
  }

  async verifyPayment({ orderId, paymentId, signature, raw = {} }) {
    const merchantId = this.credentials.merchantId || this.credentials.keyId;
    const path = `/pg/v1/status/${merchantId}/${orderId}`;
    const checksum = crypto
      .createHash("sha256")
      .update(path + this.credentials.secret)
      .digest("hex");
    const xVerify = `${checksum}###1`;

    const response = await fetch(`${this.getApiBase()}${path}`, {
      headers: { "X-VERIFY": xVerify, "X-MERCHANT-ID": merchantId },
    });

    const result = await response.json();
    const payment = result?.data;

    if (!payment || payment.state !== "COMPLETED") {
      throw new Error(`PhonePe payment status: ${payment?.state || "UNKNOWN"}`);
    }

    return {
      verified: true,
      transactionId: payment.transactionId || paymentId || orderId,
      gatewayOrderId: orderId,
      paymentMethodType: payment.paymentInstrument?.type || "unknown",
      amount: Number(payment.amount || 0) / 100,
      raw: payment,
      signature: signature || payment.transactionId,
    };
  }

  buildCheckoutPageHtml(data) {
    const payUrl = escapeHtml(data.session.metadata?.payUrl || "");
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Payment</title></head>
<body><script>window.location.replace("${payUrl}");</script></body></html>`;
  }
}
