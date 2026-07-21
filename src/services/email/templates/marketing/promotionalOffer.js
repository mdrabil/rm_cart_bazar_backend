import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderPrimaryButton,
  renderInfoCard,
  renderAlertBox,
} from "../../components/index.js";

export const promotionalOfferEmail = (data = {}) => {
  const {
    customerName = "",
    offerTitle = "Exclusive Offer",
    offerDescription = "",
    discountCode = "",
    discountPercent = "",
    validUntil = "",
    ctaLabel = "Shop Now",
    ctaUrl,
    website = BRAND.website,
  } = data;

  const urls = getBrandUrls({ website });
  const subject = data.subject || `${offerTitle} — ${discountPercent ? `${discountPercent}% Off` : "Special Offer"} | ${BRAND.companyName}`;

  const html = renderBaseLayout({
    title: subject,
    preheader: discountCode ? `Use code ${discountCode} at checkout` : offerTitle,
    heroHtml: renderHero({
      eyebrow: "Limited Time Offer",
      title: offerTitle,
      subtitle: offerDescription || "Customize your products and save on your next order.",
      backgroundColor: BRAND.colors.secondary,
    }),
    bodyHtml: [
      customerName ? `<p>Hi <strong>${escapeHtml(customerName)}</strong>,</p>` : "",
      discountCode
        ? renderInfoCard({
            title: "Your Promo Code",
            content: `<div style="text-align:center;font-size:28px;font-weight:800;letter-spacing:4px;color:${BRAND.colors.secondary};padding:12px 0;">${escapeHtml(discountCode)}</div>`,
            footer: validUntil ? `Valid until ${escapeHtml(validUntil)}` : "",
          })
        : "",
      renderAlertBox({
        type: "warning",
        title: "Don't miss out",
        message: "This offer is available for a limited time only.",
      }),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: ctaLabel, href: ctaUrl || urls.website })}</td></tr></table>`,
    ].join(""),
  });

  return buildEmailPayload({ subject, html, text: `${offerTitle}\nCode: ${discountCode}` });
};

export default promotionalOfferEmail;
