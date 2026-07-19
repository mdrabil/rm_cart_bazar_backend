// import crypto from "crypto";
// import Razorpay from "razorpay";
// import {
//   CLIENT_HELPERS,
//   escapeHtml,
//   shouldUseServerRedirect,
//   mapStatus,
// } from "../../config.js";
// import { PAYMENT_STATUS } from "../../../constants/enums.js";
// import * as webhook from "./webhook.js";

// export default function createRazorpayService(credentials, gatewayDoc) {
//   const client = () =>
//     new Razorpay({ key_id: credentials.keyId, key_secret: credentials.secret });

//   return {
//     gatewayName: gatewayDoc.gatewayName,

//     async createPayment({ amount, sessionId, platform, apiBaseUrl, session }) {
//       const order = await client().orders.create({
//         amount: Math.round(amount * 100),
//         currency: "INR",
//         receipt: sessionId,
//       });
//       return {
//         gatewayOrderId: order.id,
//         publicKey: credentials.keyId,
//         amountPaise: order.amount,
//         currency: order.currency,
//         metadata: {},
//         raw: order,
//       };
//     },

//     async verifyPayment({ orderId, paymentId, signature }) {
//       let pid = paymentId;
//       if (!pid && orderId) {
//         const list = await client().orders.fetchPayments(orderId);
//         const hit = list?.items?.find((p) => p.status === "captured");
//         if (!hit) throw new Error("Payment not completed at gateway");
//         pid = hit.id;
//       }
//       if (!pid) throw new Error("Missing payment id");

//       if (signature) {
//         const body = `${orderId}|${pid}`;
//         const expected = crypto.createHmac("sha256", credentials.secret).update(body).digest("hex");
//         if (expected !== signature) throw new Error("Invalid payment signature");
//       }

//       const details = await client().payments.fetch(pid);
//       if (
//         details.status !== "captured" &&
//         mapStatus("razorpay", details.status) !== PAYMENT_STATUS.SUCCESS
//       ) {
//         throw new Error(`Razorpay status: ${details.status}`);
//       }

//       return {
//         verified: true,
//         transactionId: pid,
//         gatewayOrderId: orderId,
//         paymentMethodType: details.method || "unknown",
//         amount: Number(details.amount) / 100,
//         currency: details.currency || "INR",
//         status: PAYMENT_STATUS.SUCCESS,
//         raw: details,
//       };
//     },

//     parseReturn(req) {
//       const s = { ...(req.query || {}), ...(req.body || {}) };
//       return {
//         gatewayOrderId: s.razorpay_order_id || s.order_id || s.orderId,
//         transactionId: s.razorpay_payment_id || s.payment_id || s.paymentId,
//         signature: s.razorpay_signature || s.signature,
//       };
//     },

//     getCspDirectives() {
//       return [
//         "script-src 'self' https://checkout.razorpay.com https://*.razorpay.com 'unsafe-inline'",
//         "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
//         "connect-src 'self' https://api.razorpay.com https://*.razorpay.com",
//       ];
//     },

//     buildCheckoutPage(data) {
//       const returnUrl = escapeHtml(data.session.returnUrl || "");
//       const cancelUrl = escapeHtml(data.session.cancelUrl || "");
//       const sessionId = escapeHtml(data.session.sessionId);
//       const useRedirect = shouldUseServerRedirect(data.session.platform, data.apiBaseUrl);
//       const callbackUrl = useRedirect
//         ? escapeHtml(`${data.apiBaseUrl}/api/payment/return/${sessionId}`)
//         : "";

//       return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Payment</title></head><body><script>
// ${CLIENT_HELPERS}
// (function(){
//   var returnUrl="${returnUrl}", cancelUrl="${cancelUrl}", apiBase="${escapeHtml(data.apiBaseUrl || "")}", sessionId="${sessionId}", booted=false;
//   function boot(n){ if(booted)return; n=n||0;
//     if(typeof Razorpay==="undefined"){ if(n>100)return fail("Unable to load gateway"); setTimeout(function(){boot(n+1);},100); return; }
//     booted=true;
//     var o={
//       key:"${escapeHtml(data.publicKey)}",
//       amount:${Number(data.amountPaise)||0},
//       currency:"INR",
//       name:"MRcrafted",
//       order_id:"${escapeHtml(data.gatewayOrderId)}",
//       ${useRedirect ? `redirect:true, callback_url:"${callbackUrl}",` : `handler:function(response){
//         var u=apiBase+"/api/payment/return/"+sessionId;
//         var p=new URLSearchParams();
//         if(response.razorpay_order_id) p.set("razorpay_order_id", response.razorpay_order_id);
//         if(response.razorpay_payment_id) p.set("razorpay_payment_id", response.razorpay_payment_id);
//         if(response.razorpay_signature) p.set("razorpay_signature", response.razorpay_signature);
//         location.href=u+(u.indexOf("?")>-1?"&":"?")+p.toString();
//       },`}
//       modal:{ ondismiss:function(){ if(cancelUrl) redirectWithParams(cancelUrl, new URLSearchParams({status:"cancelled"})); } }
//     };
//     var rzp=new Razorpay(o);
//     rzp.on("payment.failed",function(resp){
//       var p=new URLSearchParams({status:"failed"});
//       var reason=resp&&resp.error&&(resp.error.description||resp.error.reason);
//       if(reason) p.set("reason", String(reason));
//       if(cancelUrl) redirectWithParams(cancelUrl, p);
//     });
//     rzp.open();
//   }
//   loadScript("https://checkout.razorpay.com/v1/checkout.js",function(){boot(0);});
// })();</script></body></html>`;
//     },

//     webhook,
//   };
// }



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
      console.log(`[Razorpay][CreateOrder] sessionId=${sessionId} amount=${amount} platform=${platform}`);
      const order = await client().orders.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: sessionId,
      });
      console.log(`[Razorpay][CreateOrder] sessionId=${sessionId} gatewayOrderId=${order.id}`);
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
      console.log(`[Razorpay][Verify] orderId=${orderId} paymentId=${paymentId || "(none, will look up)"} hasSignature=${Boolean(signature)}`);
      let pid = paymentId;
      if (!pid && orderId) {
        // Source-of-truth fallback: used when the client only had the
        // gateway order id (e.g. checkout window closed manually before the
        // handler callback captured payment_id/signature). We ask Razorpay
        // directly instead of trusting anything the client reported.
        console.log(`[Razorpay][Verify] no paymentId supplied, fetching payments for orderId=${orderId}`);
        const list = await client().orders.fetchPayments(orderId);
        const hit = list?.items?.find((p) => p.status === "captured");
        if (!hit) {
          console.warn(`[Razorpay][Verify] no captured payment found for orderId=${orderId}`);
          throw new Error("Payment not completed at gateway");
        }
        pid = hit.id;
        console.log(`[Razorpay][Verify] resolved paymentId=${pid} for orderId=${orderId} via gateway lookup`);
      }
      if (!pid) throw new Error("Missing payment id");

      if (signature) {
        const body = `${orderId}|${pid}`;
        const expected = crypto.createHmac("sha256", credentials.secret).update(body).digest("hex");
        if (expected !== signature) {
          console.warn(`[Razorpay][Verify] signature mismatch orderId=${orderId} paymentId=${pid}`);
          throw new Error("Invalid payment signature");
        }
      }

      const details = await client().payments.fetch(pid);
      if (
        details.status !== "captured" &&
        mapStatus("razorpay", details.status) !== PAYMENT_STATUS.SUCCESS
      ) {
        console.warn(`[Razorpay][Verify] orderId=${orderId} paymentId=${pid} status=${details.status}`);
        throw new Error(`Razorpay status: ${details.status}`);
      }

      console.log(`[Razorpay][Verify] SUCCESS orderId=${orderId} paymentId=${pid} amount=${Number(details.amount) / 100}`);
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
      // Razorpay's checkout.js also calls out to https://lumberjack.razorpay.com
      // for its own telemetry/analytics; without it in connect-src the browser
      // console shows CSP violations that are easy to mistake for the app-level
      // "CORS blocked" error but are actually harmless (they don't affect
      // payment flow) — included here so they don't show up at all.
      return [
        "script-src 'self' https://checkout.razorpay.com https://*.razorpay.com 'unsafe-inline'",
        "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com",
        "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://lumberjack.razorpay.com",
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
  var returnUrl="${returnUrl}", cancelUrl="${cancelUrl}", apiBase="${escapeHtml(data.apiBaseUrl || "")}",
      sessionId="${sessionId}", gatewayOrderId="${escapeHtml(data.gatewayOrderId)}", booted=false, settled=false;

  function log(msg){ try{ console.log("[RazorpayCheckout] "+msg); }catch(e){} }

  // Single exit point for every outcome (success, failure, cancel, or a
  // manually-closed window). We ALWAYS hand off to the backend /return
  // endpoint with whatever gateway identifiers we have, instead of ever
  // deciding "cancelled" on the client. The backend re-verifies against
  // Razorpay's API (source of truth) before redirecting, so a payment that
  // actually succeeded is never misreported just because the user closed
  // the popup before our handler callback finished.
  function settleAndRedirect(params, reasonLabel){
    if (settled) { log("already settled ("+reasonLabel+" ignored)"); return; }
    settled = true;
    log("settling via "+reasonLabel+", handing off to backend /return for verification");
    var u = apiBase + "/api/payment/return/" + sessionId;
    location.href = u + (u.indexOf("?")>-1?"&":"?") + params.toString();
  }

  function boot(n){ if(booted)return; n=n||0;
    if(typeof Razorpay==="undefined"){ if(n>100){ log("gateway script failed to load"); return fail("Unable to load gateway"); } setTimeout(function(){boot(n+1);},100); return; }
    booted=true;
    log("gateway loaded, opening checkout for order "+gatewayOrderId);
    var o={
      key:"${escapeHtml(data.publicKey)}",
      amount:${Number(data.amountPaise)||0},
      currency:"INR",
      name:"MRcrafted",
      order_id: gatewayOrderId,
      ${useRedirect ? `redirect:true, callback_url:"${callbackUrl}",` : `handler:function(response){
        log("handler fired: payment_id="+response.razorpay_payment_id);
        var p=new URLSearchParams();
        p.set("razorpay_order_id", response.razorpay_order_id || gatewayOrderId);
        if(response.razorpay_payment_id) p.set("razorpay_payment_id", response.razorpay_payment_id);
        if(response.razorpay_signature) p.set("razorpay_signature", response.razorpay_signature);
        settleAndRedirect(p, "handler");
      },`}
      modal:{ ondismiss:function(){
        log("checkout modal dismissed by user");
        // Do NOT assume cancelled here — many users close the window right
        // after paying, before the handler callback runs. Send the known
        // gateway order id to the backend so it can look up the real
        // payment status directly from Razorpay before redirecting.
        var p=new URLSearchParams();
        p.set("razorpay_order_id", gatewayOrderId);
        settleAndRedirect(p, "dismiss");
      }}
    };
    var rzp=new Razorpay(o);
    rzp.on("payment.failed",function(resp){
      log("payment.failed event: "+(resp&&resp.error&&resp.error.description));
      var p=new URLSearchParams();
      p.set("razorpay_order_id", gatewayOrderId);
      var reason=resp&&resp.error&&(resp.error.description||resp.error.reason);
      if(reason) p.set("reason", String(reason));
      settleAndRedirect(p, "payment.failed");
    });
    rzp.open();
  }
  loadScript("https://checkout.razorpay.com/v1/checkout.js",function(){boot(0);});
})();</script></body></html>`;
    },

    webhook,
  };
}