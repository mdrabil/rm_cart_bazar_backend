import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderPrimaryButton,
  renderProductList,
  renderInfoCard,
} from "../../components/index.js";

export const reviewRequestEmail = (data = {}) => {
  const {
    customerName = "",
    orderNumber = "",
    items = [],
    reviewUrl,
    website = BRAND.website,
  } = data;

  const urls = getBrandUrls({ website });
  const subject = `How was your order? — ${BRAND.companyName}`;

  const html = renderBaseLayout({
    title: subject,
    preheader: "We'd love your feedback on your recent purchase.",
    heroHtml: renderHero({
      eyebrow: "Your Opinion Matters",
      title: "How Did We Do?",
      subtitle: "Share your experience and help us improve our custom printing service.",
    }),
    bodyHtml: [
      customerName ? `<p>Hi <strong>${escapeHtml(customerName)}</strong>,</p>` : "",
      orderNumber
        ? renderInfoCard({
            title: "Your Recent Order",
            content: `Order <strong>#${escapeHtml(orderNumber)}</strong>`,
          })
        : "",
      items.length ? renderProductList({ items }) : "",
      `<p style="line-height:1.7;margin:16px 0;">Your feedback helps us deliver better customized products and improves the experience for our entire community.</p>`,
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: "Write a Review", href: reviewUrl || urls.orders })}</td></tr></table>`,
    ].join(""),
  });

  return buildEmailPayload({ subject, html, text: subject });
};

export default reviewRequestEmail;
