import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderPrimaryButton,
  renderSecondaryButton,
  renderInfoCard,
} from "../../components/index.js";

export const newsletterEmail = (data = {}) => {
  const {
    customerName = "",
    headline = "What's New at MR Crafted",
    contentHtml = "",
    ctaLabel = "Explore Now",
    ctaUrl,
    website = BRAND.website,
    unsubscribeUrl = "",
  } = data;

  const urls = getBrandUrls({ website });
  const subject = data.subject || `${headline} — ${BRAND.companyName} Newsletter`;

  const html = renderBaseLayout({
    title: subject,
    preheader: data.preheader || headline,
    heroHtml: renderHero({
      eyebrow: "Newsletter",
      title: headline,
      subtitle: data.subtitle || "Latest updates, new products & exclusive offers.",
    }),
    bodyHtml: [
      customerName ? `<p>Hi <strong>${escapeHtml(customerName)}</strong>,</p>` : "",
      contentHtml ||
        renderInfoCard({
          title: "This Month",
          content: `<p style="margin:0;line-height:1.7;">Discover new customizable products, seasonal collections, and printing inspiration from the MR Crafted team.</p>`,
        }),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: ctaLabel, href: ctaUrl || urls.website })}</td></tr></table>`,
      unsubscribeUrl
        ? `<p style="text-align:center;font-size:12px;color:${BRAND.colors.textMuted};"><a href="${escapeHtml(unsubscribeUrl)}" style="color:${BRAND.colors.textMuted};">Unsubscribe</a></p>`
        : "",
    ].join(""),
  });

  return buildEmailPayload({ subject, html, text: subject });
};

export default newsletterEmail;
