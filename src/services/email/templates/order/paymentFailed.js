import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const paymentFailedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Payment Failed — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your payment could not be processed. Please try again.",
    eyebrow: "Payment Issue",
    title: "Payment Failed",
    subtitle:
      "Unfortunately, we couldn't process your payment. Your order has not been confirmed yet.",
    statusLabel: data.paymentStatus || "Payment Failed",
    statusType: "danger",
    showProducts: false,
    showPricing: false,
    alert: {
      type: "error",
      title: "Action Required",
      message:
        "Please retry payment or choose a different payment method to complete your order.",
    },
    ctaLabel: "Retry Payment",
    secondaryCtaLabel: "Contact Support",
    secondaryCtaUrl: `mailto:${BRAND.supportEmail}`,
  });

export default paymentFailedEmail;
