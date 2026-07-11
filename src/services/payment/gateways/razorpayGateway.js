import crypto from "crypto";
import Razorpay from "razorpay";
import { GATEWAY_MODE } from "../../../models/PaymentGateway.model.js";
import { BaseGateway } from "./baseGateway.js";
import {
  CLIENT_HELPERS,
  escapeHtml,
  shouldUseServerRedirect,
} from "./checkoutPageUtils.js";

export class RazorpayGateway extends BaseGateway {
  getClient() {
    return new Razorpay({
      key_id: this.credentials.keyId,
      key_secret: this.credentials.secret,
    });
  }

  getCspDirectives() {
    return [
      "script-src 'self' https://checkout.razorpay.com https://*.razorpay.com 'unsafe-inline'",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
      "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com https://checkout.razorpay.com",
      "form-action 'self' https://api.razorpay.com https://*.razorpay.com",
      "child-src https://api.razorpay.com https://*.razorpay.com",
    ];
  }

  async createOrder({ amount, currency = "INR", receipt, notes = {} }) {
    const client = this.getClient();
    const order = await client.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes,
    });

    return {
      gatewayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      publicKey: this.credentials.keyId,
      raw: order,
    };
  }

  async generateCheckoutSession({ amount, currency = "INR", sessionId }) {
    const order = await this.createOrder({
      amount,
      currency,
      receipt: sessionId,
    });

    return {
      gatewayOrderId: order.gatewayOrderId,
      publicKey: this.credentials.keyId,
      amount: order.amount,
      currency: order.currency,
      gatewayName: this.gatewayName,
      raw: order.raw,
    };
  }

  verifySignature({ orderId, paymentId, signature }) {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
      .createHmac("sha256", this.credentials.secret)
      .update(body)
      .digest("hex");
    return expected === signature;
  }

  async verifyPayment({ orderId, paymentId, signature }) {
    const verified = this.verifySignature({ orderId, paymentId, signature });
    if (!verified) {
      throw new Error("Payment signature verification failed");
    }

    const client = this.getClient();
    const paymentDetails = await client.payments.fetch(paymentId);

    return {
      verified: true,
      transactionId: paymentId,
      gatewayOrderId: orderId,
      paymentMethodType: paymentDetails.method || "unknown",
      amount: Number(paymentDetails.amount) / 100,
      raw: paymentDetails,
      signature,
    };
  }

  verifyWebhookSignature(req) {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = this.credentials.webhookSecret;

    if (!webhookSecret) {
      return { valid: false, reason: "Webhook secret not configured" };
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    return {
      valid: expected === signature,
      eventId: req.body?.payload?.payment?.entity?.id,
    };
  }

  async handleWebhookEvent(event) {
    const entity =
      event?.payload?.payment?.entity ||
      event?.payload?.order?.entity ||
      event?.payload?.refund?.entity;

    return {
      eventType: event?.event || "unknown",
      transactionId: entity?.id,
      gatewayOrderId: entity?.order_id,
      status: entity?.status,
      amount: entity?.amount ? Number(entity.amount) / 100 : undefined,
      raw: event,
    };
  }

  async getPaymentStatus({ paymentId }) {
    const client = this.getClient();
    const paymentDetails = await client.payments.fetch(paymentId);

    return {
      status: paymentDetails.status,
      raw: paymentDetails,
    };
  }

  buildWebsiteClientCheckout({ checkout }) {
    return {
      mode: "razorpay",
      gatewayName: this.gatewayName,
      publicKey: checkout.publicKey || this.getPublicKey(),
      orderId: checkout.gatewayOrderId,
      amount: checkout.amount,
      currency: checkout.currency || "INR",
    };
  }

  buildCheckoutPageHtml(data) {
    const returnUrl = escapeHtml(data.session.returnUrl || "");
    const cancelUrl = escapeHtml(data.session.cancelUrl || "");
    const sessionId = escapeHtml(data.session.sessionId);
    const useRedirect = shouldUseServerRedirect(
      data.session.platform,
      data.apiBaseUrl
    );
    const callbackUrl = useRedirect
      ? escapeHtml(`${data.apiBaseUrl}/api/payment/return/${sessionId}`)
      : "";

    const redirectConfig = useRedirect
      ? `redirect: true,
            callback_url: "${callbackUrl}",`
      : "";

    const successHandler = useRedirect
      ? ""
      : `handler: function(response) {
              var params = new URLSearchParams({
                gatewayName: "Razorpay",
                gatewayOrderId: response.razorpay_order_id,
                transactionId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                status: "success",
              });
              redirectWithParams(returnUrl, params);
            },`;

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
      var booted = false;
      var maxAttempts = 100;

      function boot(attempt) {
        if (booted) return;
        attempt = attempt || 0;
        if (typeof Razorpay === "undefined") {
          if (attempt >= maxAttempts) {
            fail("Unable to load payment gateway.");
            return;
          }
          setTimeout(function () { boot(attempt + 1); }, 100);
          return;
        }
        booted = true;
        try {
          var options = {
            key: "${escapeHtml(data.publicKey)}",
            amount: ${Number(data.amountPaise) || 0},
            currency: "${escapeHtml(data.currency || "INR")}",
            name: "MR Brand",
            description: "Order Payment",
            order_id: "${escapeHtml(data.gatewayOrderId)}",
            ${redirectConfig}
            ${successHandler}
            modal: {
              ondismiss: function () {
                if (cancelUrl) {
                  window.location.href = cancelUrl + (cancelUrl.indexOf("?") > -1 ? "&" : "?") + "status=cancelled";
                }
              },
            },
          };
          var rzp = new Razorpay(options);
          rzp.on("payment.failed", function () {
            if (cancelUrl) {
              window.location.href = cancelUrl + (cancelUrl.indexOf("?") > -1 ? "&" : "?") + "status=failed";
            }
          });
          rzp.open();
        } catch (error) {
          fail("Unable to open payment gateway.");
          console.error(error);
        }
      }

      loadScript("https://checkout.razorpay.com/v1/checkout.js", function () { boot(0); });
    })();
  </script>
</body>
</html>`;
  }
}
