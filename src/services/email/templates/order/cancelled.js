import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const cancelledEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Order Cancelled — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your order has been cancelled.",
    eyebrow: "Order Cancelled",
    title: "Order Cancelled",
    subtitle: data.cancellationReason
      ? `Reason: ${data.cancellationReason}`
      : "Your order has been cancelled as requested.",
    statusLabel: "Cancelled",
    statusType: "danger",
    showProducts: true,
    showPricing: true,
    alert: {
      type: "error",
      title: "Order Cancelled",
      message:
        data.refundNote ||
        "If a payment was made, refund details will be shared separately.",
    },
    ctaLabel: "Contact Support",
    secondaryCtaLabel: "Continue Shopping",
  });

export default cancelledEmail;
