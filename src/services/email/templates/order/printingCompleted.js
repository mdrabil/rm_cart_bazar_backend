import { BRAND } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const printingCompletedEmail = (data = {}) =>
  buildOrderStatusEmail({
    ...data,
    subject: `Printing Completed — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Printing is complete. Quality check is next.",
    eyebrow: "Production Update",
    title: "Printing Completed",
    subtitle: "Your product has been printed and is heading to quality inspection.",
    statusLabel: "Print Complete",
    statusType: "success",
    ctaLabel: "Track Order",
    showPricing: false,
  });

export default printingCompletedEmail;
