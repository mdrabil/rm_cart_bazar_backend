import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const orderPlacedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Order Placed — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Thank you! We've received your order and will review your customization.",
    eyebrow: "Order Placed",
    title: "Thank You for Your Order!",
    subtitle:
      "We've received your order. Our team will review your design and begin processing shortly.",
    statusLabel: data.orderStatus || "Order Placed",
    statusType: "success",
    introHtml: `<p style="margin:0 0 16px;line-height:1.7;">Your customized order is in good hands. We'll notify you at every step — from design review to printing, packing, and delivery.</p>`,
    alert: {
      type: "info",
      title: "What happens next?",
      message:
        "Our design team will review your customization. You'll receive updates as your order progresses.",
    },
    ctaLabel: "View Order Details",
    showPricing: true,
    showProducts: true,
  });

export default orderPlacedEmail;
