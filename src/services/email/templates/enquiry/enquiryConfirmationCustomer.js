import { BRAND } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml, nl2br } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderInfoCard,
  renderKeyValueRow,
  renderAlertBox,
} from "../../components/index.js";

export const enquiryConfirmationCustomerEmail = (data = {}) => {
  const {
    customerName = "",
    email = "",
    phone = "",
    subject: enquirySubject = "",
    message = "",
    enquiryId = "",
    website = BRAND.website,
  } = data;

  const rows = [
    renderKeyValueRow({ label: "Subject", value: escapeHtml(enquirySubject || "General Enquiry") }),
    enquiryId && renderKeyValueRow({ label: "Reference ID", value: escapeHtml(enquiryId) }),
    email && renderKeyValueRow({ label: "Your Email", value: escapeHtml(email) }),
    phone && renderKeyValueRow({ label: "Phone", value: escapeHtml(phone) }),
  ]
    .filter(Boolean)
    .join("");

  const subject = `We Received Your Enquiry — ${BRAND.companyName}`;

  const html = renderBaseLayout({
    title: subject,
    preheader: "Thank you for contacting MR Crafted. We'll get back to you soon.",
    heroHtml: renderHero({
      eyebrow: "Enquiry Received",
      title: "Thank You for Reaching Out",
      subtitle: "We've received your message and our team will respond shortly.",
    }),
    bodyHtml: [
      customerName
        ? `<p style="margin:0 0 16px;">Hi <strong>${escapeHtml(customerName)}</strong>,</p>`
        : "",
      renderAlertBox({
        type: "success",
        title: "Enquiry Submitted",
        message: "We typically respond within 24–48 business hours.",
      }),
      renderInfoCard({
        title: "Your Enquiry Summary",
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`,
      }),
      message
        ? renderInfoCard({ title: "Your Message", content: nl2br(message) })
        : "",
      `<p style="margin:16px 0 0;font-size:${BRAND.typography.fontSizeSm};color:${BRAND.colors.textMuted};line-height:1.6;">If you have urgent questions, email us at <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.colors.secondary};">${BRAND.supportEmail}</a> or call ${BRAND.phone}.</p>`,
    ].join(""),
    footer: { website },
  });

  const text = [subject, `Hi ${customerName}`, `Subject: ${enquirySubject}`, message].filter(Boolean).join("\n\n");

  return buildEmailPayload({ subject, html, text });
};

export default enquiryConfirmationCustomerEmail;
