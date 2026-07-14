import crypto from "crypto";
import Razorpay from "razorpay";
import {
  CLIENT_HELPERS,
  escapeHtml,
  shouldUseServerRedirect,
  mapStatus,
} from "../../config.js";
import { PAYMENT_STATUS } from "../../../constants/enums.js";
import * as webhook from "./webhook.js";

export default function createRazorpayService(credentials, gatewayDoc) {
  const client = () =>
    new Razorpay({ key_id: credentials.keyId, key_secret: credentials.secret });

  return {
    gatewayName: gatewayDoc.gatewayName,

    async createPayment({ amount, sessionId, platform, apiBaseUrl, session }) {
      const order = await client().orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: sessionId,
      });
      return {
        gatewayOrderId: order.id,
        publicKey: credentials.keyId,
        amountPaise: order.amount,
        currency: order.currency,
        metadata: {},
        raw: order,
      };
    },

    async verifyPayment({ orderId, paymentId, signature }) {
      let pid = paymentId;
      if (!pid && orderId) {
        const list = await client().orders.fetchPayments(orderId);
        const hit = list?.items?.find((p) => p.status === "captured");
        if (!hit) throw new Error("Payment not completed at gateway");
        pid = hit.id;
      }
      if (!pid) throw new Error("Missing payment id");

      if (signature) {
        const body = `${orderId}|${pid}`;
        const expected = crypto.createHmac("sha256", credentials.secret).update(body).digest("hex");
        if (expected !== signature) throw new Error("Invalid payment signature");
      }

      const details = await client().payments.fetch(pid);
      if (
        details.status !== "captured" &&
        mapStatus("razorpay", details.status) !== PAYMENT_STATUS.SUCCESS
      ) {
        throw new Error(`Razorpay status: ${details.status}`);
      }

      return {
        verified: true,
        transactionId: pid,
        gatewayOrderId: orderId,
        paymentMethodType: details.method || "unknown",
        amount: Number(details.amount) / 100,
        currency: details.currency || "INR",
        status: PAYMENT_STATUS.SUCCESS,
        raw: details,
      };
    },

    parseReturn(req) {
      const s = { ...(req.query || {}), ...(req.body || {}) };
      return {
        gatewayOrderId: s.razorpay_order_id || s.order_id || s.orderId,
        transactionId: s.razorpay_payment_id || s.payment_id || s.paymentId,
        signature: s.razorpay_signature || s.signature,
      };
    },

    getCspDirectives() {
      return [
        "script-src 'self' https://checkout.razorpay.com https://*.razorpay.com 'unsafe-inline'",
        "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
        "connect-src 'self' https://api.razorpay.com https://*.razorpay.com",
      ];
    },

    buildCheckoutPage(data) {
      const returnUrl = escapeHtml(data.session.returnUrl || "");
      const cancelUrl = escapeHtml(data.session.cancelUrl || "");
      const sessionId = escapeHtml(data.session.sessionId);
      const useRedirect = shouldUseServerRedirect(data.session.platform, data.apiBaseUrl);
      const callbackUrl = useRedirect
        ? escapeHtml(`${data.apiBaseUrl}/api/payment/return/${sessionId}`)
        : "";

      return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Payment</title></head><body><script>
${CLIENT_HELPERS}
(function(){
  var returnUrl="${returnUrl}", cancelUrl="${cancelUrl}", apiBase="${escapeHtml(data.apiBaseUrl || "")}", sessionId="${sessionId}", booted=false;
  function boot(n){ if(booted)return; n=n||0;
    if(typeof Razorpay==="undefined"){ if(n>100)return fail("Unable to load gateway"); setTimeout(function(){boot(n+1);},100); return; }
    booted=true;
    var o={
      key:"${escapeHtml(data.publicKey)}",
      amount:${Number(data.amountPaise)||0},
      currency:"INR",
      name:"MRcraft",
      order_id:"${escapeHtml(data.gatewayOrderId)}",
      ${useRedirect ? `redirect:true, callback_url:"${callbackUrl}",` : `handler:function(response){
        var u=apiBase+"/api/payment/return/"+sessionId;
        var p=new URLSearchParams();
        if(response.razorpay_order_id) p.set("razorpay_order_id", response.razorpay_order_id);
        if(response.razorpay_payment_id) p.set("razorpay_payment_id", response.razorpay_payment_id);
        if(response.razorpay_signature) p.set("razorpay_signature", response.razorpay_signature);
        location.href=u+(u.indexOf("?")>-1?"&":"?")+p.toString();
      },`}
      modal:{ ondismiss:function(){ if(cancelUrl) redirectWithParams(cancelUrl, new URLSearchParams({status:"cancelled"})); } }
    };
    var rzp=new Razorpay(o);
    rzp.on("payment.failed",function(resp){
      var p=new URLSearchParams({status:"failed"});
      var reason=resp&&resp.error&&(resp.error.description||resp.error.reason);
      if(reason) p.set("reason", String(reason));
      if(cancelUrl) redirectWithParams(cancelUrl, p);
    });
    rzp.open();
  }
  loadScript("https://checkout.razorpay.com/v1/checkout.js",function(){boot(0);});
})();</script></body></html>`;
    },

    webhook,
  };
}
