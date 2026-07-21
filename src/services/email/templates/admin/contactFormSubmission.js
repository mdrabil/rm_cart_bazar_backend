import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml, nl2br } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderInfoCard,
  renderKeyValueRow,
  renderPrimaryButton,
} from "../../components/index.js";

export const contactFormSubmissionEmail = (data = {}) => {
  const {
    customerName = "",
    email = "",
    phone = "",
    subject: formSubject = "",
    message = "",
    adminPanelUrl,
    website = BRAND.website,
  } = data;

  const urls = getBrandUrls({ website, adminPanelUrl });
  const subject = `Contact Form: ${formSubject || "New Submission"} — ${BRAND.companyName}`;

  const rows = [
    renderKeyValueRow({ label: "Name", value: escapeHtml(customerName) }),
    renderKeyValueRow({ label: "Email", value: escapeHtml(email) }),
    phone && renderKeyValueRow({ label: "Phone", value: escapeHtml(phone) }),
    formSubject && renderKeyValueRow({ label: "Subject", value: escapeHtml(formSubject) }),
  ]
    .filter(Boolean)
    .join("");

  const html = renderBaseLayout({
    title: subject,
    preheader: `Contact form from ${customerName || email}`,
    heroHtml: renderHero({
      eyebrow: "Contact Form",
      title: "New Contact Submission",
      subtitle: "A visitor submitted the contact form on your website.",
    }),
    bodyHtml: [
      renderInfoCard({
        title: "Contact Details",
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`,
      }),
      message ? renderInfoCard({ title: "Message", content: nl2br(message) }) : "",
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: "Open Admin Panel", href: urls.adminDashboard })}</td></tr></table>`,
    ].join(""),
  });

  return buildEmailPayload({ subject, html, text: `${subject}\n${message}` });
};

export default contactFormSubmissionEmail;
