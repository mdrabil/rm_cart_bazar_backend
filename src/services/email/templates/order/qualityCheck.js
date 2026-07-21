import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const qualityCheckEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Quality Check — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your order is undergoing a final quality inspection.",
    eyebrow: "Quality Assurance",
    title: "Quality Check in Progress",
    subtitle: "We're performing a final quality check to ensure your product meets our standards.",
    statusLabel: "Quality Check",
    statusType: "info",
    introHtml: `<p style="margin:0;line-height:1.7;">Every MR Crafted product goes through a thorough quality inspection before packing.</p>`,
    ctaLabel: "Track Order",
    showPricing: false,
  });

export default qualityCheckEmail;
