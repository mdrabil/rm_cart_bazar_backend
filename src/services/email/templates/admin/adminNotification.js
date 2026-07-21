import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml, nl2br } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderAlertBox,
  renderInfoCard,
  renderPrimaryButton,
} from "../../components/index.js";

export const adminNotificationEmail = (data = {}) => {
  const {
    title = "Admin Notification",
    message = "",
    details = {},
    alertType = "info",
    ctaLabel = "Open Dashboard",
    ctaUrl,
    adminPanelUrl,
    website = BRAND.website,
  } = data;

  const urls = getBrandUrls({ website, adminPanelUrl });
  const subject = data.subject || `${title} — ${BRAND.companyName} Admin`;

  const detailRows = Object.entries(details)
    .map(
      ([key, value]) =>
        `<tr><td style="padding:6px 0;color:${BRAND.colors.textMuted};font-size:13px;">${escapeHtml(key)}</td><td align="right" style="padding:6px 0;font-size:13px;font-weight:600;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = renderBaseLayout({
    title: subject,
    preheader: message || title,
    heroHtml: renderHero({
      eyebrow: "Admin Notification",
      title,
      subtitle: data.subtitle || "",
    }),
    bodyHtml: [
      message
        ? renderAlertBox({ type: alertType, title, message })
        : "",
      Object.keys(details).length
        ? renderInfoCard({
            title: "Details",
            content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${detailRows}</table>`,
          })
        : "",
      data.bodyHtml || "",
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: ctaLabel, href: ctaUrl || urls.adminDashboard })}</td></tr></table>`,
    ].join(""),
  });

  return buildEmailPayload({ subject, html, text: `${title}\n\n${message}` });
};

export default adminNotificationEmail;
