import { escapeHtml } from "../../config.js";

const STRIPE_API = "https://api.stripe.com/v1";
const noopWebhook = { verifySignature: () => ({ valid: false }), parseEvent: () => ({}) };

export default function createStripeService(credentials, gatewayDoc) {
  const stripePost = async (path, body) => {
    const res = await fetch(`${STRIPE_API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${credentials.secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || "Stripe request failed");
    return json;
  };

  return {
    gatewayName: gatewayDoc.gatewayName,
    async createPayment({ amount, sessionId, customer, returnUrl, cancelUrl }) {
      const session = await stripePost("/checkout/sessions", {
        mode: "payment",
        success_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}status=processing&sessionId=${sessionId}`,
        cancel_url: cancelUrl || returnUrl,
        "line_items[0][price_data][currency]": "inr",
        "line_items[0][price_data][product_data][name]": "MRcrafted Order",
        "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
        "line_items[0][quantity]": "1",
        client_reference_id: sessionId,
        customer_email: customer?.email || undefined,
      });
      return {
        gatewayOrderId: sessionId,
        publicKey: credentials.keyId,
        amountPaise: Math.round(amount * 100),
        metadata: { checkoutUrl: session.url, stripeSessionId: session.id },
        raw: session,
      };
    },
    async verifyPayment({ orderId, paymentId }) {
      const pid = paymentId || orderId;
      const session = await fetch(`${STRIPE_API}/checkout/sessions/${pid}`, {
        headers: { Authorization: `Bearer ${credentials.secret}` },
      }).then((r) => r.json());
      if (session.payment_status !== "paid") throw new Error(`Stripe status: ${session.payment_status}`);
      return {
        verified: true,
        transactionId: session.payment_intent || pid,
        gatewayOrderId: orderId,
        amount: Number(session.amount_total || 0) / 100,
        status: "SUCCESS",
        raw: session,
      };
    },
    parseReturn(req) {
      const s = { ...(req.query || {}), ...(req.body || {}) };
      return { gatewayOrderId: s.sessionId || s.orderId, transactionId: s.transactionId, signature: s.signature };
    },
    getCspDirectives: () => ["form-action 'self' https://checkout.stripe.com"],
    buildCheckoutPage(data) {
      const url = escapeHtml(data.session.metadata?.checkoutUrl || "");
      return `<!DOCTYPE html><html><body><script>location.replace("${url}");</script></body></html>`;
    },
    webhook: noopWebhook,
  };
}
