import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const designStartedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Design Started — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Our design team has started working on your customization.",
    eyebrow: "Design Update",
    title: "Design Process Started",
    subtitle: "Our creative team is now working on your custom design.",
    statusLabel: "Design Started",
    statusType: "info",
    introHtml: `<p style="margin:0;line-height:1.7;">We're carefully preparing your design to ensure the best print quality for your personalized product.</p>`,
    ctaLabel: "View Order",
  });

export default designStartedEmail;
