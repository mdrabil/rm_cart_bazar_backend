import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const packedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Order Packed — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your order has been packed and is ready for dispatch.",
    eyebrow: "Fulfillment Update",
    title: "Your Order Has Been Packed",
    subtitle: "Your customized products have been carefully packed and are ready to ship.",
    statusLabel: "Packed",
    statusType: "success",
    ctaLabel: "Track Order",
    showPricing: false,
  });

export default packedEmail;
