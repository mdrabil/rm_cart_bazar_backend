import { BaseGateway } from "./baseGateway.js";
import { escapeHtml } from "./checkoutPageUtils.js";

const STRIPE_API = "https://api.stripe.com/v1";

export class StripeGateway extends BaseGateway {
  getCspDirectives() {
    return [
      "script-src 'self' 'unsafe-inline'",
      "form-action 'self' https://checkout.stripe.com",
    ];
  }

  async stripeRequest(path, body) {
    const response = await fetch(`${STRIPE_API}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.credentials.secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error?.message || "Stripe request failed");
    }
    return result;
  }

  async generateCheckoutSession({
    amount,
    currency = "INR",
    customer,
    sessionId,
    returnUrl,
    cancelUrl,
  }) {
    const session = await this.stripeRequest("/checkout/sessions", {
      mode: "payment",
      success_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}gatewayName=Stripe&gatewayOrderId=${sessionId}&transactionId={CHECKOUT_SESSION_ID}&signature={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: cancelUrl || returnUrl,
      "line_items[0][price_data][currency]": currency.toLowerCase(),
      "line_items[0][price_data][product_data][name]": "MR Brand Order",
      "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
      "line_items[0][quantity]": "1",
      client_reference_id: sessionId,
      customer_email: customer?.email || undefined,
    });

    return {
      gatewayOrderId: sessionId,
      publicKey: this.credentials.keyId,
      amount: Math.round(amount * 100),
      currency,
      gatewayName: this.gatewayName,
      metadata: { checkoutUrl: session.url, stripeSessionId: session.id },
      raw: session,
    };
  }

  buildWebsiteClientCheckout({ checkout }) {
    return {
      mode: "redirect",
      gatewayName: this.gatewayName,
      redirectUrl: checkout.metadata?.checkoutUrl,
      orderId: checkout.gatewayOrderId,
    };
  }

  async verifyPayment({ orderId, paymentId, signature }) {
    const session = await fetch(`${STRIPE_API}/checkout/sessions/${paymentId}`, {
      headers: { Authorization: `Bearer ${this.credentials.secret}` },
    }).then((res) => res.json());

    if (session.payment_status !== "paid") {
      throw new Error(`Stripe payment status: ${session.payment_status}`);
    }

    return {
      verified: true,
      transactionId: session.payment_intent || paymentId,
      gatewayOrderId: orderId,
      paymentMethodType: "card",
      amount: Number(session.amount_total || 0) / 100,
      raw: session,
      signature: signature || paymentId,
    };
  }

  buildCheckoutPageHtml(data) {
    const checkoutUrl = escapeHtml(data.session.metadata?.checkoutUrl || "");
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Payment</title></head>
<body><script>window.location.replace("${checkoutUrl}");</script></body></html>`;
  }
}
