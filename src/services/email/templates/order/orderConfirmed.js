import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const orderConfirmedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Order Confirmed — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your order has been confirmed and is being prepared.",
    eyebrow: "Order Confirmed",
    title: "Your Order is Confirmed",
    subtitle: "We've confirmed your order and it's now in our production queue.",
    statusLabel: data.orderStatus || "Confirmed",
    statusType: "success",
    alert: {
      type: "success",
      title: "Order Confirmed",
      message: "Our team will begin working on your customized products shortly.",
    },
    ctaLabel: "Track Order",
  });

export default orderConfirmedEmail;
