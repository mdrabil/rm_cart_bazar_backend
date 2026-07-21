import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const refundInitiatedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Refund Initiated — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your refund has been initiated and is being processed.",
    eyebrow: "Refund Update",
    title: "Refund Initiated",
    subtitle: data.refundAmount
      ? `A refund of ₹${data.refundAmount} has been initiated to your original payment method.`
      : "Your refund has been initiated and will be processed shortly.",
    statusLabel: "Refund Initiated",
    statusType: "warning",
    showProducts: false,
    alert: {
      type: "info",
      title: "Processing Time",
      message:
        "Refunds typically take 5–7 business days to reflect in your account, depending on your bank.",
    },
    ctaLabel: "View Order",
  });

export default refundInitiatedEmail;
