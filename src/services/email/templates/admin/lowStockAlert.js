import { BRAND, getBrandUrls } from "../../brand.js";
import { buildEmailPayload } from "../../helpers/index.js";
import { escapeHtml } from "../../helpers/escape.js";
import { renderBaseLayout } from "../../layout/baseLayout.js";
import {
  renderHero,
  renderAlertBox,
  renderInfoCard,
  renderKeyValueRow,
  renderStockBadge,
  renderPrimaryButton,
} from "../../components/index.js";

export const lowStockAlertEmail = (data = {}) => {
  const {
    productName = "",
    productSku = "",
    currentStock = 0,
    threshold = 5,
    productImage = "",
    adminPanelUrl,
    website = BRAND.website,
  } = data;

  const urls = getBrandUrls({ website, adminPanelUrl });
  const subject = `Low Stock Alert: ${productName} — ${BRAND.companyName}`;

  const rows = [
    renderKeyValueRow({ label: "Product", value: escapeHtml(productName) }),
    productSku && renderKeyValueRow({ label: "SKU", value: escapeHtml(productSku) }),
    renderKeyValueRow({ label: "Current Stock", value: escapeHtml(currentStock), bold: true }),
    renderKeyValueRow({ label: "Alert Threshold", value: escapeHtml(threshold) }),
  ].join("");

  const html = renderBaseLayout({
    title: subject,
    preheader: `${productName} is running low (${currentStock} remaining)`,
    heroHtml: renderHero({
      eyebrow: "Inventory Alert",
      title: "Low Stock Warning",
      subtitle: "A product has fallen below the minimum stock threshold.",
      backgroundColor: BRAND.colors.secondary,
    }),
    bodyHtml: [
      renderAlertBox({
        type: "warning",
        title: "Restock Required",
        message: `"${productName}" has only ${currentStock} unit(s) left. Please restock soon to avoid order delays.`,
      }),
      productImage
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;"><tr><td align="center"><img src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)}" width="120" style="border-radius:8px;border:1px solid ${BRAND.colors.border};" /></td></tr></table>`
        : "",
      renderStockBadge({ inStock: Number(currentStock) > 0 }),
      renderInfoCard({
        title: "Product Details",
        content: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`,
      }),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:16px 0;">${renderPrimaryButton({ label: "Manage Inventory", href: urls.adminDashboard })}</td></tr></table>`,
    ].join(""),
  });

  return buildEmailPayload({
    subject,
    html,
    text: `Low stock: ${productName} (${currentStock} remaining, threshold: ${threshold})`,
  });
};

export default lowStockAlertEmail;
