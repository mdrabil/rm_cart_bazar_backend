import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const refundCompletedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Refund Completed — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your refund has been successfully processed.",
    eyebrow: "Refund Complete",
    title: "Refund Completed",
    subtitle: data.refundAmount
      ? `Your refund of ₹${data.refundAmount} has been successfully processed.`
      : "Your refund has been completed successfully.",
    statusLabel: "Refund Completed",
    statusType: "success",
    showProducts: false,
    showPricing: false,
    alert: {
      type: "success",
      title: "Refund Processed",
      message: "The amount should appear in your account within the processing window of your payment provider.",
    },
    ctaLabel: "Shop Again",
  });

export default refundCompletedEmail;
