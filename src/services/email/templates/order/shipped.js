import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const shippedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Order Shipped — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: `Your order is on its way via ${data.courierName || "courier"}.`,
    eyebrow: "Shipping Update",
    title: "Your Order Has Shipped!",
    subtitle: data.courierName
      ? `Shipped via ${data.courierName}${data.trackingNumber ? ` — Tracking: ${data.trackingNumber}` : ""}.`
      : "Your package is on its way to you.",
    statusLabel: "Shipped",
    statusType: "info",
    alert: {
      type: "info",
      title: "On the way",
      message: data.estimatedDeliveryDate
        ? `Estimated delivery: ${new Date(data.estimatedDeliveryDate).toLocaleDateString("en-IN")}`
        : "You'll receive another update when it's out for delivery.",
    },
    ctaLabel: "Track Shipment",
  });

export default shippedEmail;
