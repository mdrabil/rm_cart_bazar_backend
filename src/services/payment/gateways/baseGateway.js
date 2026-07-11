import {
  appendQuery,
  buildReturnQuery,
  escapeHtml,
  shouldUseServerRedirect,
  CLIENT_HELPERS,
} from "./checkoutPageUtils.js";

export class BaseGateway {
  constructor(gatewayDoc, credentials) {
    this.gatewayDoc = gatewayDoc;
    this.credentials = credentials;
    this.gatewayName = gatewayDoc.gatewayName;
  }

  getName() {
    return this.gatewayName;
  }

  getDisplayName() {
    return this.gatewayDoc.displayName;
  }

  getPublicKey() {
    return this.credentials.keyId;
  }

  isProduction() {
    return this.credentials.mode === "production";
  }

  getCspDirectives() {
    return [
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https:",
      "frame-src 'self' https:",
      "child-src https:",
    ];
  }

  parseReturnPayload(req) {
    const source = { ...(req.query || {}), ...(req.body || {}) };

    return {
      gatewayOrderId:
        source.razorpay_order_id ||
        source.order_id ||
        source.orderId ||
        source.txnid ||
        source.txnId ||
        source.merchantTransactionId ||
        source.ORDER_ID ||
        source.orderId,
      transactionId:
        source.razorpay_payment_id ||
        source.payment_id ||
        source.paymentId ||
        source.mihpayid ||
        source.transactionId ||
        source.TXNID ||
        source.cf_payment_id,
      signature:
        source.razorpay_signature ||
        source.signature ||
        source.hash ||
        source.checksumHash,
      status: source.status,
      raw: source,
    };
  }

  buildReturnRedirectUrl(session, parsed) {
    const params = buildReturnQuery({
      gatewayName: this.gatewayName,
      gatewayOrderId: parsed.gatewayOrderId,
      transactionId: parsed.transactionId,
      signature: parsed.signature,
      razorpay_order_id: parsed.gatewayOrderId,
      razorpay_payment_id: parsed.transactionId,
      razorpay_signature: parsed.signature,
    });

    return appendQuery(session.returnUrl, params);
  }

  buildWebsiteClientCheckout({ checkout, returnUrl, cancelUrl }) {
    return {
      mode: this.gatewayName?.toLowerCase(),
      gatewayName: this.gatewayName,
      publicKey: checkout.publicKey || this.getPublicKey(),
      orderId: checkout.gatewayOrderId,
      amount: checkout.amount,
      currency: checkout.currency || "INR",
      returnUrl,
      cancelUrl,
      metadata: checkout.metadata || {},
    };
  }

  buildCheckoutPageHtml() {
    throw new Error(
      `Checkout page is not implemented for gateway "${this.gatewayName}"`
    );
  }

  buildHostedCheckoutHtml(data, config) {
    const returnUrl = escapeHtml(data.session.returnUrl || "");
    const cancelUrl = escapeHtml(data.session.cancelUrl || "");
    const sessionId = escapeHtml(data.session.sessionId);
    const useServerRedirect = shouldUseServerRedirect(
      data.session.platform,
      data.apiBaseUrl
    );
    const callbackUrl = useServerRedirect
      ? escapeHtml(`${data.apiBaseUrl}/api/payment/return/${sessionId}`)
      : "";

    const successHandler = useServerRedirect
      ? ""
      : `handler: function(response) {
          var params = new URLSearchParams({
            gatewayName: "${escapeHtml(this.gatewayName)}",
            gatewayOrderId: response.${config.orderField},
            transactionId: response.${config.paymentField},
            signature: response.${config.signatureField},
            razorpay_order_id: response.${config.orderField},
            razorpay_payment_id: response.${config.paymentField},
            razorpay_signature: response.${config.signatureField},
            status: "success",
          });
          redirectWithParams(returnUrl, params);
        },`;

    const redirectConfig = useServerRedirect
      ? `redirect: true,
         callback_url: "${callbackUrl}",`
      : "";

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

      function boot() {
        if (booted) return;
        if (typeof ${config.globalName} === "undefined") {
          setTimeout(boot, 100);
          return;
        }
        booted = true;
        try {
          var options = ${config.optionsJson};
          ${redirectConfig ? `options.redirect = true; options.callback_url = "${callbackUrl}";` : ""}
          ${successHandler ? `options.handler = ${successHandler.replace("handler: ", "")}` : ""}
          var instance = new ${config.globalName}(options);
          if (instance.on) {
            instance.on("payment.failed", function () {
              if (cancelUrl) {
                window.location.href = cancelUrl + (cancelUrl.indexOf("?") > -1 ? "&" : "?") + "status=failed";
              }
            });
          }
          instance.open();
        } catch (error) {
          fail("Unable to open payment gateway.");
          console.error(error);
        }
      }

      loadScript("${config.scriptUrl}", boot);
    })();
  </script>
</body>
</html>`;
  }

  async createOrder() {
    throw new Error(`${this.gatewayName}: createOrder not implemented`);
  }

  async verifyPayment() {
    throw new Error(`${this.gatewayName}: verifyPayment not implemented`);
  }

  async generateCheckoutSession() {
    throw new Error(
      `${this.gatewayName}: generateCheckoutSession not implemented`
    );
  }

  verifyWebhookSignature() {
    throw new Error(
      `${this.gatewayName}: verifyWebhookSignature not implemented`
    );
  }

  async handleWebhookEvent() {
    throw new Error(`${this.gatewayName}: handleWebhookEvent not implemented`);
  }
}

export class UnimplementedGateway extends BaseGateway {
  constructor(gatewayDoc, credentials) {
    super(gatewayDoc, credentials);
    this._message = `Gateway "${gatewayDoc.displayName}" is registered in admin but driver is not implemented yet.`;
  }

  async createOrder() {
    throw new Error(this._message);
  }

  async verifyPayment() {
    throw new Error(this._message);
  }

  async generateCheckoutSession() {
    throw new Error(this._message);
  }

  buildCheckoutPageHtml(data) {
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><title>Payment</title></head>
<body><p>${escapeHtml(this._message)}</p></body></html>`;
  }
}
