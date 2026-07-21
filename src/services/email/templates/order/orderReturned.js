import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const orderReturnedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Return Received — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "We have received your returned order.",
    eyebrow: "Return Update",
    title: "Return Received",
    subtitle: "We've received your returned item and are processing your request.",
    statusLabel: "Returned",
    statusType: "neutral",
    showProducts: true,
    alert: {
      type: "info",
      title: "Return in Progress",
      message:
        data.returnNote ||
        "Our team will inspect the returned item and process your refund or replacement as applicable.",
    },
    ctaLabel: "View Order Status",
  });

export default orderReturnedEmail;
