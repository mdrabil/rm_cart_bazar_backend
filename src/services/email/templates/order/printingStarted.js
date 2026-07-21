import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const printingStartedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Printing Started — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your customized product is now being printed.",
    eyebrow: "Production Update",
    title: "Printing Has Started",
    subtitle: "Your personalized product is now on our printing floor.",
    statusLabel: "Printing",
    statusType: "info",
    introHtml: `<p style="margin:0;line-height:1.7;">Our printing team is bringing your design to life with premium materials and precision printing.</p>`,
    ctaLabel: "Track Order",
    showPricing: false,
  });

export default printingStartedEmail;
