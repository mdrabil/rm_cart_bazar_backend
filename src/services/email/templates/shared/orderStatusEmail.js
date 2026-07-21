import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml } from "../../helpers/escape.js";
import { formatPlainAddress } from "../../helpers/formatters.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderStatusBadge,
  renderAlertBox,
  renderPrimaryButton,
  renderSecondaryButton,
  renderOrderSummaryTable,
  renderCustomerDetailsTable,
  renderProductList,
  renderPricingTotals,
  renderDivider,
} from "../../components/index.js";

/**
 * Shared builder for order lifecycle emails.
 * Individual template files call this with specific hero/status config.
 */
export const buildOrderStatusEmail = ({
  // Email meta
  subject,
  preheader = "",
  title,
  subtitle = "",
  eyebrow = "",
  statusLabel = "",
  statusType = "info",
  introHtml = "",
  bodyHtml = "",
  alert = null,
  ctaLabel = "Track Your Order",
  ctaUrl,
  secondaryCtaLabel = "",
  secondaryCtaUrl = "",
  showProducts = true,
  showPricing = true,
  showCustomerDetails = true,
  showOrderSummary = true,

  // Order data
  customerName,
  email,
  phone,
  orderNumber,
  orderDate,
  paymentStatus,
  paymentMethod,
  orderStatus,
  items = [],
  subtotal,
  shipping,
  tax,
  discount,
  grandTotal,
  shippingAddress,
  billingAddress,
  estimatedDeliveryDate,
  courierName,
  trackingNumber,
  trackOrderUrl,
  website = BRAND.website,
} = {}) => {
  const urls = getBrandUrls({ website });
  const trackUrl =
    ctaUrl || trackOrderUrl || `${urls.trackOrder}/${orderNumber || ""}`;

  const heroBadge = statusLabel
    ? renderStatusBadge({ label: statusLabel, type: statusType })
    : null;

  const heroHtml = renderHero({
    eyebrow: eyebrow || "Order Update",
    title: title || subject,
    subtitle,
    badge: heroBadge,
  });

  const greeting = customerName
    ? `<p style="margin:0 0 16px;font-size:${BRAND.typography.fontSizeBase};color:${BRAND.colors.text};">Hi <strong>${escapeHtml(customerName)}</strong>,</p>`
    : "";

  const alertHtml = alert
    ? renderAlertBox({
        type: alert.type || "info",
        title: alert.title,
        message: alert.message,
      })
    : "";

  const sections = [
    greeting,
    introHtml,
    alertHtml,
    bodyHtml,
    showOrderSummary
      ? renderOrderSummaryTable({
          orderNumber,
          orderDate,
          paymentStatus,
          paymentMethod,
          orderStatus,
          estimatedDeliveryDate,
          courierName,
          trackingNumber,
        })
      : "",
    showCustomerDetails
      ? renderCustomerDetailsTable({
          customerName,
          email,
          phone,
          shippingAddress,
          billingAddress,
        })
      : "",
    showProducts ? renderProductList({ items }) : "",
    showPricing
      ? renderPricingTotals({ subtotal, shipping, tax, discount, grandTotal })
      : "",
    renderDivider(),
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:8px 0 4px;">${renderPrimaryButton({ label: ctaLabel, href: trackUrl })}</td></tr>${
      secondaryCtaLabel && secondaryCtaUrl
        ? `<tr><td align="center" style="padding-top:12px;">${renderSecondaryButton({ label: secondaryCtaLabel, href: secondaryCtaUrl })}</td></tr>`
        : ""
    }</table>`,
    `<p style="margin:20px 0 0;font-size:${BRAND.typography.fontSizeSm};color:${BRAND.colors.textMuted};line-height:1.6;text-align:center;">Need help? Reply to this email or contact us at <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.colors.secondary};text-decoration:none;">${BRAND.supportEmail}</a></p>`,
  ]
    .filter(Boolean)
    .join("");

  const html = renderBaseLayout({
    title: subject,
    preheader: preheader || subtitle || subject,
    heroHtml,
    bodyHtml: sections,
  });

  const text = [
    subject,
    customerName ? `Hi ${customerName},` : "",
    subtitle,
    orderNumber ? `Order: ${orderNumber}` : "",
    orderStatus ? `Status: ${orderStatus}` : "",
    trackingNumber ? `Tracking: ${trackingNumber}` : "",
    grandTotal != null ? `Total: ${grandTotal}` : "",
    shippingAddress ? `Ship to: ${formatPlainAddress(shippingAddress)}` : "",
    `Track order: ${trackUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return buildEmailPayload({ subject, html, text });
};
