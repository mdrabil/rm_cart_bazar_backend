import { BRAND, getBrandUrls } from "../../brand.js";
import { buildOrderStatusEmail } from "../shared/orderStatusEmail.js";

export const designApprovalRequiredEmail = (data = {}) => {
  const urls = getBrandUrls({ website: data.website });
  return buildOrderStatusEmail({
    ...data,
    subject: `Design Approval Required — #${data.orderNumber || ""} | ${BRAND.companyName}`,
    preheader: "Please review and approve your design to continue production.",
    eyebrow: "Action Required",
    title: "Please Approve Your Design",
    subtitle:
      "Your design is ready for review. We need your approval before we start printing.",
    statusLabel: "Awaiting Approval",
    statusType: "warning",
    alert: {
      type: "warning",
      title: "Approval Needed",
      message:
        "Please review your customization preview and approve it so we can proceed with printing.",
    },
    ctaLabel: "Review & Approve Design",
    trackOrderUrl: data.approvalUrl || data.trackOrderUrl,
    showPricing: false,
  });
};

export default designApprovalRequiredEmail;
