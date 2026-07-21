import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const designApprovedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Design Approved — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Your design has been approved. Printing will begin soon.",
    eyebrow: "Design Update",
    title: "Design Approved",
    subtitle: "Great news! Your design has been approved and we're moving to production.",
    statusLabel: "Design Approved",
    statusType: "success",
    alert: {
      type: "success",
      title: "Approved",
      message: "Your customization meets our quality standards. Printing will begin shortly.",
    },
    ctaLabel: "Track Order",
    showPricing: false,
  });

export default designApprovedEmail;
