import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const deliveredEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Delivered — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your order has been delivered. We hope you love it!",
    eyebrow: "Delivery Complete",
    title: "Order Delivered!",
    subtitle: "Your customized order has been successfully delivered. We hope you love it!",
    statusLabel: "Delivered",
    statusType: "success",
    alert: {
      type: "success",
      title: "Enjoy your product!",
      message: "We'd love to hear your feedback. Share a review to help other customers.",
    },
    ctaLabel: "Leave a Review",
    secondaryCtaLabel: "Shop Again",
    showPricing: false,
  });

export default deliveredEmail;
