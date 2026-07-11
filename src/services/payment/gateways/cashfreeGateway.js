import crypto from "crypto";
import { BaseGateway } from "./baseGateway.js";
import { escapeHtml, CLIENT_HELPERS } from "./checkoutPageUtils.js";

const CASHFREE_API = {
  development: "https://sandbox.cashfree.com/pg",
  production: "https://api.cashfree.com/pg",
};

export class CashfreeGateway extends BaseGateway {
  getApiBase() {
    return CASHFREE_API[this.credentials.mode] || CASHFREE_API.development;
  }

  getCspDirectives() {
    return [
      "script-src 'self' https://sdk.cashfree.com 'unsafe-inline'",
      "connect-src 'self' https://sandbox.cashfree.com https://api.cashfree.com https://sdk.cashfree.com",
      "frame-src 'self' https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com https://*.cashfree.com",
      "form-action 'self' https://sandbox.cashfree.com https://api.cashfree.com https://payments.cashfree.com",
    ];
  }

  async createCashfreeOrder({ amount, currency = "INR", customer, sessionId }) {
    const response = await fetch(`${this.getApiBase()}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": this.credentials.keyId,
        "x-client-secret": this.credentials.secret,
      },
      body: JSON.stringify({
        order_id: sessionId,
        order_amount: Number(amount),
        order_currency: currency,
        customer_details: {
          customer_id: String(customer?.phone || customer?.email || sessionId),
          customer_phone: customer?.phone || "9999999999",
          customer_email: customer?.email || "customer@example.com",
          customer_name: customer?.name || "Customer",
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Cashfree order creation failed");
    }

    return result;
  }

  async generateCheckoutSession({ amount, currency = "INR", customer, sessionId }) {
    const order = await this.createCashfreeOrder({
      amount,
      currency,
      customer,
      sessionId,
    });

    return {
      gatewayOrderId: order.order_id,
      publicKey: this.credentials.keyId,
      amount: Math.round(amount * 100),
      currency,
      gatewayName: this.gatewayName,
      metadata: {
        paymentSessionId: order.payment_session_id,
        cashfreeMode: this.credentials.mode,
      },
      raw: order,
    };
  }

  buildWebsiteClientCheckout({ checkout }) {
    return {
      mode: "cashfree",
      gatewayName: this.gatewayName,
      publicKey: checkout.publicKey || this.getPublicKey(),
      paymentSessionId: checkout.metadata?.paymentSessionId,
      cashfreeMode: checkout.metadata?.cashfreeMode || this.credentials.mode,
      orderId: checkout.gatewayOrderId,
    };
  }

  async verifyPayment({ orderId }) {
    const response = await fetch(`${this.getApiBase()}/orders/${orderId}`, {
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": this.credentials.keyId,
        "x-client-secret": this.credentials.secret,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Cashfree verification failed");
    }

    if (result.order_status !== "PAID") {
      throw new Error(`Cashfree order status: ${result.order_status}`);
    }

    const payment = result?.payments?.[0] || {};

    return {
      verified: true,
      transactionId: payment.cf_payment_id || payment.payment_id || orderId,
      gatewayOrderId: orderId,
      paymentMethodType: payment.payment_method || "unknown",
      amount: Number(result.order_amount || 0),
      raw: result,
      signature: payment.cf_payment_id || orderId,
    };
  }

  buildCheckoutPageHtml(data) {
    const returnUrl = escapeHtml(data.session.returnUrl || "");
    const cancelUrl = escapeHtml(data.session.cancelUrl || "");
    const paymentSessionId = escapeHtml(
      data.session.metadata?.paymentSessionId || ""
    );
    const mode =
      data.session.metadata?.cashfreeMode === "production"
        ? "production"
        : "sandbox";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Payment</title>
</head>
<body>
  <script>
    ${CLIENT_HELPERS}
    (function () {
      var returnUrl = "${returnUrl}";
      var cancelUrl = "${cancelUrl}";
      function boot() {
        if (!window.Cashfree) {
          setTimeout(boot, 100);
          return;
        }
        try {
          var cashfree = Cashfree({ mode: "${mode}" });
          cashfree.checkout({
            paymentSessionId: "${paymentSessionId}",
            redirectTarget: "_self",
          }).then(function () {
            var params = new URLSearchParams({
              gatewayName: "Cashfree",
              gatewayOrderId: "${escapeHtml(data.gatewayOrderId)}",
              transactionId: "${escapeHtml(data.gatewayOrderId)}",
              signature: "${escapeHtml(data.gatewayOrderId)}",
              status: "success",
            });
            redirectWithParams(returnUrl, params);
          }).catch(function () {
            if (cancelUrl) {
              window.location.href = cancelUrl + (cancelUrl.indexOf("?") > -1 ? "&" : "?") + "status=failed";
            }
          });
        } catch (error) {
          fail("Unable to open Cashfree checkout.");
          console.error(error);
        }
      }
      loadScript("https://sdk.cashfree.com/js/v3/cashfree.js", boot);
    })();
  </script>
</body>
</html>`;
  }
}
