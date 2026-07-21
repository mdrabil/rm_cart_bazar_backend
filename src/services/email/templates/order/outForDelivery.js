import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const outForDeliveryEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Out for Delivery — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your order is out for delivery and will arrive today.",
    eyebrow: "Delivery Update",
    title: "Out for Delivery",
    subtitle: "Great news! Your customized order is out for delivery and should arrive soon.",
    statusLabel: "Out for Delivery",
    statusType: "warning",
    alert: {
      type: "warning",
      title: "Arriving Today",
      message: "Please ensure someone is available to receive the package.",
    },
    ctaLabel: "Track Delivery",
    showPricing: false,
  });

export default outForDeliveryEmail;
