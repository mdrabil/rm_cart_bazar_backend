import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml, nl2br } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderInfoCard,
  renderKeyValueRow,
  renderPrimaryButton,
  renderAlertBox,
} from "../../components/index.js";

export const enquiryReceivedAdminEmail = (data = {}) => {
  const {
    customerName = "",
    email = "",
    phone = "",
    subject: enquirySubject = "",
    message = "",
    enquiryId = "",
    adminPanelUrl,
    website = BRAND.website,
  } = data;

  const urls = getBrandUrls({ website, adminPanelUrl });

  const rows = [
    renderKeyValueRow({ label: "Name", value: escapeHtml(customerName) }),
    renderKeyValueRow({ label: "Email", value: escapeHtml(email) }),
    phone && renderKeyValueRow({ label: "Phone", value: escapeHtml(phone) }),
    enquirySubject &&
      renderKeyValueRow({ label: "Subject", value: escapeHtml(enquirySubject) }),
    enquiryId &&
      renderKeyValueRow({ label: "Enquiry ID", value: escapeHtml(enquiryId) }),
  ]
    .filter(Boolean)
    .join("");

  const subject = `New Enquiry${enquirySubject ? `: ${enquirySubject}` : ""} — ${BRAND.companyName}`;

  const html = renderBaseLayout({
    title: subject,
    preheader: `New enquiry from ${customerName || email}`,
    heroHtml: renderHero({
      eyebrow: "Admin Alert",
      title: "New Customer Enquiry",
      subtitle: "A new enquiry has been submitted on your website.",
    }),
    bodyHtml: [
      renderAlertBox({
        type: "info",
        title: "Action Required",
        message: "Please review and respond to this enquiry from your admin dashboard.",
      }),
      renderInfoCard({
        title: "Enquiry Details",
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`,
      }),
      message
        ? renderInfoCard({
            title: "Message",
            content: nl2br(message),
          })
        : "",
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: "Open Dashboard", href: urls.adminEnquiries })}</td></tr></table>`,
    ].join(""),
  });

  const text = [
    subject,
    `Name: ${customerName}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : "",
    enquirySubject ? `Subject: ${enquirySubject}` : "",
    message,
    `Dashboard: ${urls.adminEnquiries}`,
  ]
    .filter(Boolean)
    .join("\n");

  return buildEmailPayload({ subject, html, text });
};

export default enquiryReceivedAdminEmail;
