import crypto from "crypto";
import { CLIENT_HELPERS, escapeHtml, mapStatus, normalizePaymentMethodType } from "../../config.js";
import * as webhook from "./webhook.js";

const API = {
  development: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
};

export default function createCashfreeService(credentials, gatewayDoc) {
  const base = () => API[credentials.mode] || API.development;

  const headers = () => ({
    "x-api-version": "2023-08-01",
    "x-client-id": credentials.keyId.trim(),
    "x-client-secret": credentials.secret.trim(),
  });

  async function fetchOrderPayments(orderId) {
    const res = await fetch(`${base()}/orders/${orderId}/payments`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return [];
    return Array.isArray(data) ? data : [];
  }

  function pickSuccessfulPayment(payments = []) {
    return (
      payments.find((p) => String(p.payment_status || "").toUpperCase() === "SUCCESS") ||
      payments[0] ||
      {}
    );
  }

  return {
    gatewayName: gatewayDoc.gatewayName,

    async createPayment({ amount, sessionId, customer, apiBaseUrl }) {
      const apiBase = String(apiBaseUrl || "").replace(/\/$/, "");
      const orderMeta = {
        // Cashfree redirects here after payment; backend verifies then sends user to website/app.
        return_url: `${apiBase}/api/payment/return/{order_id}`,
      };
      if (credentials.webhookUrl) {
        orderMeta.notify_url = credentials.webhookUrl;
      }

      const res = await fetch(`${base()}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": credentials.keyId.trim(),
          "x-client-secret": credentials.secret.trim(),
        },
        body: JSON.stringify({
          order_id: sessionId,
          order_amount: Number(amount),
          order_currency: "INR",
          customer_details: {
            customer_id: String(customer?.phone || sessionId),
            customer_phone: customer?.phone || "9999999999",
            customer_email: customer?.email || "customer@example.com",
            customer_name: customer?.name || "Customer",
          },
          order_meta: orderMeta,
        }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order?.message || "Cashfree order failed");
      return {
        gatewayOrderId: order.order_id,
        publicKey: credentials.keyId,
        amountPaise: Math.round(amount * 100),
        currency: "INR",
        metadata: {
          paymentSessionId: order.payment_session_id,
          cashfreeMode: credentials.mode,
        },
        raw: order,
      };
    },

    async verifyPayment({ orderId }) {
      const res = await fetch(`${base()}/orders/${orderId}`, { headers: headers() });
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Cashfree verify failed");
      if (result.order_status !== "PAID") {
        throw new Error(`Cashfree status: ${result.order_status}`);
      }

      let payment = pickSuccessfulPayment(result?.payments);
      if (!payment.cf_payment_id && !payment.payment_id) {
        payment = pickSuccessfulPayment(await fetchOrderPayments(orderId));
      }

      const methodRaw = payment.payment_group || payment.payment_method;
      return {
        verified: true,
        transactionId: payment.cf_payment_id || payment.payment_id || orderId,
        gatewayOrderId: orderId,
        paymentMethodType: normalizePaymentMethodType(methodRaw, "cashfree"),
        amount: Number(payment.payment_amount || result.order_amount || 0),
        currency: "INR",
        status: "SUCCESS",
        raw: { order: result, payment },
      };
    },

    parseReturn(req) {
      const s = { ...(req.query || {}), ...(req.body || {}) };
      return {
        gatewayOrderId: s.order_id || s.orderId || s.gatewayOrderId,
        transactionId: s.cf_payment_id || s.transactionId,
        signature: s.signature,
      };
    },

    getCspDirectives() {
      return [
        "script-src 'self' https://sdk.cashfree.com 'unsafe-inline'",
        "connect-src 'self' https://sandbox.cashfree.com https://api.cashfree.com https://sdk.cashfree.com",
        "frame-src 'self' https://*.cashfree.com",
      ];
    },

    buildCheckoutPage(data) {
      const ps = escapeHtml(data.session.metadata?.paymentSessionId || "");
      const mode = data.session.metadata?.cashfreeMode === "production" ? "production" : "sandbox";
      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payment</title></head><body><script>
${CLIENT_HELPERS}
(function(){ function boot(){ if(!window.Cashfree){ setTimeout(boot,100); return; }
Cashfree({mode:"${mode}"}).checkout({ paymentSessionId:"${ps}", redirectTarget:"_self" });
} loadScript("https://sdk.cashfree.com/js/v3/cashfree.js", boot); })();</script></body></html>`;
    },

    webhook,
  };
}
